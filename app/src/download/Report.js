import React, { Component } from "react";
import Papa from 'papaparse';
import "./Report.css";
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
                return "Failed";
            }
        });
    }

    getECQCResults(row) {
        row.map(x=> {
            if (!isNaN(parseFloat(x)) && parseFloat(x) < 40) {
                return "Pass";
            } else {
                return 'Failed';
            }
        });
    }

    getNTCCondition(rows) {
        const evalRows = rows.slice(2,6);
        const ntcConditions = [...new Set(evalRows.map(x=>x[1]))];
        if (ntcConditions.length === 1 && ntcConditions[0] === 'Undetermined') {
            return 'Pass';
        } else {
            return 'Failed';
        }
    }

    getPCCondition(rows) {
        const evalRows = rows.slice(2,6);
        const pcConditions = [...new Set(evalRows.map(x=>x[x.length-2]))];
        for (const con in pcConditions) {
            if (isNaN(parseFloat(con))) {
                return "Failed";
            } else if  (parseFloat(con) > 40.0) {
                return "Failed"
            }
        }
        return "Pass";
    }

    getECCondition(cols) {
        return (cols[0] === 'Undetermined' && cols[1] === 'Undetermined'
            && cols[2] === 'Undetermined' && !isNaN(parseFloat(cols[3])) &&
                parseFloat(cols[3]) < 40.0)
    }

    getECQCRow(rows) {
        let ecRow = []
        const eRows = rows.slice(2,6);
        for (let i = 0;i < eRows[0].length-2; i++) {
            const cols = eRows.map(x=>x[i]);
            if (this.getECCondition(cols)) {
                ecRow.push("Pass");
            } else {
                ecRow.push("Failed");
            }
        }
        console.log(ecRow)
        return ecRow;
    }

    getResultVal(cols) {
        if ([...new Set(cols)][0] === 'Undetermined') {
            return 'Inconclusive';
        }else if (!isNaN(parseFloat(cols[0])) && parseFloat(cols[0]) < 40.0
            && !isNaN(parseFloat(cols[1])) && parseFloat(cols[1]) < 40.0
            && !isNaN(parseFloat(cols[2])) && parseFloat(cols[2]) < 40.0
            && !isNaN(parseFloat(cols[3])) && parseFloat(cols[3]) < 40.0) {
            return 'Detected';
        } else {
            return "Undetected";
        }
    }

    getResultRow(rows) {
        let resRow = []
        const eRows = rows.slice(2,6);
        for (let i = 0;i < eRows[0].length-2; i++) {
            const cols = eRows.map(x=>x[i]);
            resRow.push(this.getResultVal(cols));
        }
        return resRow;
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
        if (wellName === "A") {
            rpQCRows[1] = this.getNTCCondition(rows);
            rpQCRows[rpQCRows.length - 1] = this.getPCCondition(rows);
        }
        rows.push(["RP QC",...rpQCRows, " "]);
        rows.push(["EC QC", ...(this.getECQCRow(rows))," "]);
        rows.push(["Result",...this.getResultRow(rows), " "]);
        return rows;
    }

    processData() {
        const testData = this.state.data;
        let runID, runDate;
        if (testData.length > 0) {
            runID = "RUN ID: " + testData[0].toString().split(": ")[1].replace(".sds","");
            runDate = "RUN DATE: " + testData[8].join().replace("Last Modified: ","").split(",").slice(1,3).join();
            this.setState({
                runDate: runDate,
                runID: runID
            });
            let tabData1 = [], tabData2 = [];
            const startRow = testData.findIndex(x=> x[0] === "Well");
            const endRow = testData.findIndex(x=> x[0] === "D12") + 1;
            for (let i = startRow+1; i < endRow; i++) {
                const row = testData[i];
                tabData1.push(new CovidSample(row[1],row[0],row[2], row[4]));
            }
            testData.slice(endRow, testData.length -1).map(
                row => tabData2.push(new CovidSample(row[1],row[0],row[2], row[4])));
            this.setState({aRows:this.getResults(tabData1, "A")});
            if (tabData2.length > 0) {
                this.setState({eRows:this.getResults(tabData2, "E")});
            }
        }
    }

    render() {
        return (
            <div class="all">
                <span>{this.state.runID}</span><br />
                <span>{this.state.runDate}</span><br />
                <table>
                    <thead>
                    {
                        this.state.aRows.slice(0,1).map((numList,i) =>(
                            <tr key={i} class="table1_header">
                                {
                                    numList.map((num,j)=>
                                        <th key={j}>{num}</th>
                                    )
                                }
                            </tr>
                        ))
                    }
                    </thead>
                    <tbody>
                    {
                        this.state.aRows.slice(1).map((numList,i) =>(
                            <tr key={i}>
                                {
                                    numList.map((num,j)=>
                                        <td key={j} class="table1_body">{num}</td>
                                    )
                                }
                            </tr>
                        ))
                    }
                    </tbody>
                </table><br />
                { this.state.eRows.length > 0 &&
                <table>
                    <thead>
                    {
                        this.state.eRows.slice(0,1).map((numList,i) =>(
                            <tr key={i} class="table2_header">
                                {
                                    numList.map((num,j)=>
                                        <th key={j}>{num}</th>
                                    )
                                }
                            </tr>
                        ))
                    }
                    </thead>
                    <tbody>
                    {
                        this.state.eRows.slice(1).map((numList,i) =>(
                            <tr key={i}>
                                {
                                    numList.map((num,j)=>
                                        <td key={j} class="table2_body">{num}</td>
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