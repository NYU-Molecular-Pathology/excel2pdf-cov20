import React, { Component } from "react";
import Papa from 'papaparse';
import {CovidSample} from "./CovidSample";
import "./report.css";

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

    getNTCResultVal(cols) {
        // NTC should be no readings for all 4 markers
        if (cols[0] === "Undetermined" && cols[1] === "Undetermined"
            && cols[2] === "Undetermined" && cols[3] === "Undetermined") {
            return "Pass"
        }
        else {
            return "Failed";
        }
    }

    getECResultVal(cols) {
        // EC should have RP but not any of the 3 N markers
        if (cols[0] === "Undetermined" && cols[1] === "Undetermined"
            && cols[2] === "Undetermined" && !isNaN(cols[3]) && parseFloat(cols[3]) < 40.0) {
            return "Pass"
        } else {
            return "Failed";
        }
    }

    getPCResultVal(cols) {
        //PC should have all 4 markers with CT values<40
        if (!isNaN(parseFloat(cols[0])) && parseFloat(cols[0]) < 40.0
            && !isNaN(parseFloat(cols[1])) && parseFloat(cols[1]) < 40.0
            && !isNaN(parseFloat(cols[2])) && parseFloat(cols[2]) < 40.0
            && !isNaN(parseFloat(cols[3])) && parseFloat(cols[3]) < 40.0) {
            return "Pass"
        } else {
            return "Failed";
        }
    }

    getResultVal(cols, isNTC, isEC, isPC) {
        if ([...new Set(cols)][0] === 'Undetermined' && isNTC) {
            return "Pass";
        } else if (!isNaN(parseFloat(cols[0])) && parseFloat(cols[0]) < 40.0
            && !isNaN(parseFloat(cols[1])) && parseFloat(cols[1]) < 40.0
            && !isNaN(parseFloat(cols[2])) && parseFloat(cols[2]) < 40.0
            && !isNaN(parseFloat(cols[3])) && parseFloat(cols[3]) < 40.0) {
            if (isPC) {
                return "Pass";
            } else {
                return 'Detected';
            }
        } else if (cols[0] === "Undetermined" && cols[1] === "Undetermined"
                    && cols[2] === "Undetermined" && !isNaN(cols[3]) && parseFloat(cols[3]) < 40.0) {
            if (isEC) {
                return "Pass";
            } else {
                return 'Undetected';
            }
        } else {
            return "Inconclusive";
        }
    }

    getResultRow(rows, wellName) {
        let resRow = []
        const eRows = rows.slice(2,6);
        let ntcResult, ecResult, pcResult;
        ntcResult = this.getNTCResultVal(eRows.map(x => x[1]));
        ecResult = this.getECResultVal(eRows.map(x => x[eRows[0].length - 3]));
        pcResult = this.getPCResultVal(eRows.map(x => x[eRows[0].length - 2]));
        if (wellName === "A" && (ntcResult === "Failed" || ecResult === "Failed" || pcResult === "Failed")) {
            for (let i = 0; i < eRows[0].length - 4; i++) {
                resRow.push("QC Failed");
            }
            resRow.push(ecResult, pcResult);
        } else {
            for (let i = 1;i < eRows[0].length-1; i++) {
                const cols = eRows.map(x=>x[i]);
                resRow.push(this.getResultVal(cols, (wellName === "A" && i===1),
                    (wellName === "A" && i===eRows[0].length-3),(wellName === "A" && i===eRows[0].length-2)));
            }
        }
        return resRow;
    }

    getResults(testData, wellName) {
        let rows = []
        rows.push(["Sample ID", ...new Set(testData.map(s => s.name)),"Marker"]);
        rows.push(["Plate Well", ...(testData.filter(w => w.marker === "N1").map(w=>w.well.replace(wellName,""))), " "]);
        rows.push([wellName === "A"? "A":"E",...(testData.filter(w => w.marker === "N1").map(w=>w.ctValue)), "N1"]);
        rows.push([wellName === "A"? "B":"F",...(testData.filter(w => w.marker === "N2").map(w=>w.ctValue)),"N2"]);
        rows.push([wellName === "A"? "C":"G",...(testData.filter(w => w.marker === "N3").map(w=>w.ctValue)),"N3"]);
        const qcRow = testData.filter(w => w.marker === "RP").map(w=>w.ctValue);
        rows.push([wellName === "A"? "D":"H",...qcRow, "RP"]);
        const rpQCRows = qcRow.map(x=> (!isNaN(parseFloat(x)) && parseFloat(x) < 40.0)? 'Pass':x==="Undetermined"?"Pass":x);
        rows.push(["RP QC",...rpQCRows, " "]);
        rows.push(["Result",...this.getResultRow(rows, wellName), " "]);
        return rows;
    }

    processData() {
        const testData = this.state.data;
        let runID, runDate;
        if (testData.length > 0) {
            runID = "RUN ID: " + testData[0].join().toString().split(".sds")[0].split(": ")[1];
            runDate = "RUN DATE: " + testData[8].join().replace("Last Modified: ","").split(",").slice(1,3).join();
            this.setState({
                runDate: runDate,
                runID: runID
            });
            let tabData1 = [], tabData2 = [];
            const startRow = testData.findIndex(x=> x[0] === "Well") +1;
            const endRow = testData.findIndex(x=> x[0] === "D12") + 1;
            for (let i = startRow; i < endRow; i++) {
                const row = testData[i];
                if (row.length > 1) {
                    tabData1.push(new CovidSample(row[1].trim(), row[0], row[2],
                        isNaN(parseFloat(row[4]))? row[4]: parseFloat(row[4]).toFixed(2)));
                }
            }
            const data2 = testData.slice(endRow, testData.length);
            if (data2.length > 1) {
                data2.map(
                    row => row.length > 1 && tabData2.push(new CovidSample(row[1].trim(),row[0],row[2],
                        isNaN(parseFloat(row[4]))? row[4]: parseFloat(row[4]).toFixed(2))));
            }
            this.setState({aRows: this.getResults(tabData1, "A")});
            if (tabData2.length > 0) {
                let rawRows = this.getResults(tabData2, "E");
                if (this.state.aRows[this.state.aRows.length-1][2] === "QC Failed") {
                    for (let i=1; i<rawRows[rawRows.length-1].length-1;i++) {
                        rawRows[rawRows.length-1][i] = "QC Failed";
                    }
                }
                this.setState({eRows: rawRows});
            }
        }
    }

    render() {
        return (
            <div>
                <br/>
                <span>{this.state.runID}</span> &nbsp;&nbsp;&nbsp;
                <span>{this.state.runDate}</span>
                <table>
                    <thead>
                    {
                        this.state.aRows.slice(0,1).map((numList,i) =>(
                            <tr key={i}>
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
                        this.state.aRows.slice(1, this.state.aRows.length-1).map((numList,i) =>(
                            <tr key={i}>
                                {
                                    numList.map((num,j)=>
                                        <td key={j}>{num}</td>
                                    )
                                }
                            </tr>
                        ))
                    }
                {
                    this.state.aRows.slice(this.state.aRows.length-1).map((numList,i) =>(
                        <tr key={i}>
                    {
                        numList.map((num,j)=> ["Detected","Failed","QC Failed", "Inconclusive"].includes(num)?
                            <td key={j} style={{color: "red"}}>{num}</td>:<td key={j}>{num}</td>
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
                            <tr key={i}>
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
                        this.state.eRows.slice(1, this.state.eRows.length-1).map((numList,i) =>(
                            <tr key={i}>
                                {
                                    numList.map((num,j)=>
                                        <td key={j}>{num}</td>
                                    )
                                }
                            </tr>
                        ))
                    }
                    {
                        this.state.eRows.slice(this.state.eRows.length-1).map((numList,i) =>(
                            <tr key={i}>
                        {
                            numList.map((num,j)=> ["Detected","Failed","QC Failed","Inconclusive"].includes(num)?
                                <td key={j} style={{color: "red"}}>{num}</td>:<td key={j}>{num}</td>
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