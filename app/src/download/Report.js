import React, { Component } from "react";
import Papa from 'papaparse';
import {CovidSample} from "./CovidSample";

class Report extends Component {
    constructor(props) {
        super(props);
        this.csvFile = this.props.dataFromParent[0];
        this.state = {
            data: [],
            runID: '',
            runDate: '',
            aRows: [],
            eRows: []
        };

        this.getData = this.getData.bind(this);
    }

    componentDidMount() {
        this.getCsvData();
    }
    getData(result) {
        this.setState({data: result.data});
        this.processData();
    }

    async getCsvData() {
        Papa.parse(this.csvFile, {
            complete: this.getData
        });
    }

    getRPQCResults(row) {
        row.map(x=> {
            if (!isNaN(parseFloat(x)) && parseFloat(x) < 40) {
                return "Pass";
            } else {
                return x;
            }
        });
    }

    getResults(testData, wellName) {
        let rows = []
        rows.push(["SampleID", ...new Set(testData.map(s => s.name)),"Marker"]);
        rows.push(["Plate Well", ...(testData.filter(w => w.marker === "N1").map(w=>w.well.replace(wellName,""))), " "]);
        rows.push([wellName === "A"? "A":"E",...(testData.filter(w => w.marker === "N1").map(w=>w.ctValue)), "N1"]);
        rows.push([wellName === "A"? "B":"F",...(testData.filter(w => w.marker === "N2").map(w=>w.ctValue)),"N2"]);
        rows.push([wellName === "A"? "C":"G",...(testData.filter(w => w.marker === "N3").map(w=>w.ctValue)),"N3"]);
        const qcRow = testData.filter(w => w.marker === "RP").map(w=>w.ctValue);
        rows.push([wellName === "A"? "D":"H",...qcRow, "RP"]);
        const rpQCRows = qcRow.map(x=> (!isNaN(parseFloat(x)) && parseFloat(x) < 40.0)? 'Pass':x);
        rows.push(["RP QC",...rpQCRows, " "]);
        const results = rpQCRows.map(x=> {
            if (x === "Undetermined") {
                return "Undetected";
            } else if( x === "Pass") {
                return "Undetected";
            } else {
                return "Inconclusive";
            }});
        rows.push(["Result",...results, " "]);
        return rows;
    }

    processData() {
        const testData = this.state.data;
        let runID, runDate;
        let tab1 = null, tab2 = null;
        if (testData.length > 0) {
            runID = "RUN ID: " + testData[0].toString().split(": ")[1].replace(".sds","");
            runDate = "RUN DATE: " + testData[8].join().replace("Last Modified: ","").split(",").slice(1,3).join();
            this.setState({
                runDate: runDate,
                runID: runID
            });
            let tabData1 = [], tabData2 = [];
            let startRow = testData.findIndex(x=> x[0] === "Well");
            let endRow = -1;
            for (let i = startRow+1; i < testData.length; i++) {
                const row = testData[i]
                tabData1.push(new CovidSample(row[1],row[0],row[2], row[4]))
                if (row[0].indexOf("D") !== -1 && row[1] === "PC") {
                    endRow = ++i;
                    break;
                }
            }
            testData.slice(endRow, testData.length -1).map(
                row => tabData2.push(new CovidSample(row[1],row[0],row[2], row[4])));
            this.setState({aRows:this.getResults(tabData1, "A")});
            if (tabData2.length > 0) {
                //tab2 = this.getResults(tabData2, "E");
                this.setState({eRows:this.getResults(tabData2, "e")});
            }
        }
    }

    render() {
        return (
            <div>
                <span>{this.state.runID}</span><br />
                <span>{this.state.runDate}</span><br />
                <table>
                    <tbody>
                    {
                        this.state.aRows.map((numList,i) =>(
                            <tr key={i}>
                                {
                                    numList.map((num,j)=>
                                        <td key={j}>{num}</td>
                                    )
                                }
                            </tr>
                        ))
                    }
                    </tbody>
                </table><br />
                { this.state.eRows.length > 0 && <table>
                    <tbody>
                    {
                        this.state.eRows.map((numList,i) =>(
                            <tr key={i}>
                                {
                                    numList.map((num,j)=>
                                        <td key={j}>{num}</td>
                                    )
                                }
                            </tr>
                        ))
                    }
                    </tbody>
                </table>}
            </div>
        );
    }
}
export default Report;