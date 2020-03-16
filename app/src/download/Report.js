import React, { Component } from "react";
import Workbook from '../workbook/Workbook'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/fontawesome-free-solid'
import Papa from 'papaparse';

const data1 = [
    {
        Sample_ID: 'Plate Well',
        NTC : '1',
        V20: '2',
        PC: '12',
        Marker: ''
    },
    {
        Sample_ID: 'A',
        NTC : 'Undetermined',
        V20: 'Undetermined',
        PC: '24.1288',
        Marker: 'N1'
    },
    {
        Sample_ID: 'B',
        NTC : 'Undetermined',
        V20: 'Undetermined',
        PC: '25.3337',
        Marker: 'N2'
    }
]

const data2 = [
    {
        Well1: 'Undetermined',
        PC: 25.3333
    },
    {
        Well1: 'Undetermined',
        PC: 40.3333
    }
]
class Report extends Component {
    constructor(props) {
        super(props);
        this.csvFile = this.props.dataFromParent[0];
        this.state = {
            data: []
        };

        this.getData = this.getData.bind(this);
    }

    componentDidMount() {
        this.getCsvData();
    }
    getData(result) {
        this.setState({data: result.data});
    }

    async getCsvData() {
        Papa.parse(this.csvFile, {
            complete: this.getData
        });
    }
    render() {
        if (this.state.data.length > 0) {
            console.log(this.state.data)
        }
        return (
            <div className="row text-center" style={{marginTop: '100px'}}>
                <Workbook filename="example.xlsx" element={<button className="btn btn-lg btn-primary"><FontAwesomeIcon icon={faDownload} />&nbsp;Download Test Results</button>}>
                    <Workbook.Sheet data={data1} name="Plate Well (Part I)">
                        <Workbook.Column label="Sample ID" value="Sample_ID"/>
                        <Workbook.Column label="NTC" value="NTC"/>
                        <Workbook.Column label="V20" value="V20"/>
                        <Workbook.Column label="PC" value="PC"/>
                    </Workbook.Sheet>
                    <Workbook.Sheet data={data2} name="Plate Well (Part II)">
                        <Workbook.Column label="RP QC" value={row => { if (row.PC < 40) return 'Pass'; else return 'Detected';}} />
                        <Workbook.Column label="Result" value={row => { if (row.PC < 40 && row.Well1 === 'Undetermined') return 'Undetected'; else return 'Detecteed';}} />
                    </Workbook.Sheet>
                </Workbook>
            </div>
        );
    }
}
export default Report;