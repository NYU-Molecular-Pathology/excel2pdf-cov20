import React, {Component} from "react";
import Dropzone from "../dropzone/Dropzone";
import "./Upload.css";
import Report from "../download/Report";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faDownload, faUpload} from '@fortawesome/fontawesome-free-solid'
import Pdf from "react-to-pdf";

let fileName = "";

function setFilename(fileObj) {
  fileName = fileObj.name.split(".")[0];
  return (fileName);
}

const Button = React.forwardRef((props, ref) => {

  return (

      <Pdf targetRef={ref} filename={fileName + "-report.pdf"} x={.5}
           options={{
             orientation: 'landscape', unit: 'px',
             format: [1150, 850]
           }}>
        {({toPdf}) => <button onClick={toPdf}>
          <FontAwesomeIcon icon={faDownload}/>&nbsp;Download PDF Report</button>}
      </Pdf>


  );
});

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      uploading: false,
      uploadProgress: {},
      uploadSuccessful: false
    };

    this.onFilesAdded = this.onFilesAdded.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.renderActions = this.renderActions.bind(this);
  }

  onFilesAdded(files) {
    this.setState(prevState => ({
      files: prevState.files.concat(files)
    }));
  }

  async uploadFiles() {
    this.setState({ uploadProgress: {}, uploading: true });
    const promises = [];
    for (const file of this.state.files) {
      setFilename(file);
      promises.push(this.sendRequest(file));
    }
    try {
      await Promise.all(promises);

      this.setState({uploadSuccessful: true, uploading: false});
    } catch (e) {
      // Not Production ready! Do some error handling here instead...
      this.setState({uploadSuccessful: true, uploading: false});
    }
  }

  sendRequest(file) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      req.upload.addEventListener("progress", event => {
        if (event.lengthComputable) {
          const copy = { ...this.state.uploadProgress };
          copy[file.name] = {
            state: "pending",
            percentage: (event.loaded / event.total) * 100
          };
          this.setState({ uploadProgress: copy });
        }
      });

      req.upload.addEventListener("load", event => {
        const copy = { ...this.state.uploadProgress };
        copy[file.name] = { state: "done", percentage: 100 };
        this.setState({ uploadProgress: copy });
        resolve(req.response);
      });

      req.upload.addEventListener("error", event => {
        const copy = { ...this.state.uploadProgress };
        copy[file.name] = { state: "error", percentage: 0 };
        this.setState({ uploadProgress: copy });
        reject(req.response);
      });

      const formData = new FormData();
      formData.append("file", file, file.name);

      req.open("POST", "http://localhost:8088/upload");
      req.send(formData);
    });
  }

  _refreshPage() {
    window.location.reload();
  }

  renderActions() {
    let docToPrint = React.createRef();
    if (this.state.uploadSuccessful) {
      return (
          <div>
            <div>
              <Button ref={docToPrint}/>&nbsp;&nbsp;&nbsp;
              <button onClick={this._refreshPage}><FontAwesomeIcon icon={faUpload}/>&nbsp;Upload another
                CSV&nbsp;</button>
            </div>


            <div ref={docToPrint} className="ReportCard">
              <Report dataFromParent={this.state.files}/>
            </div>
          </div>);
    } else {
      return (
          <button disabled={this.state.files.length < 1 || this.state.uploading}
                  onClick={this.uploadFiles}
          >Submit</button>
      );
    }
  }

  render() {
    return (
      <div className="Upload">

        <span className="Title">COVID-19 PDF Report Maker&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <div className="topright"><img src="nyulangone-logo.png"
                                         className="LogoIcon" alt="NYULangone"
                                         align="right"/></div>

          </span>
        <div className="Content">
          <div>
            <Dropzone className="Dzone"
                      disabled={this.state.uploading || this.state.uploadSuccessful}
                      onFilesAdded={this.onFilesAdded}

            />
          </div>
          <div>

          </div>
          <div className="Files">
            {this.state.files.length > 0 && this.state.files.map(file => {
              return (
                <div key={file.name} className="Row">
                  <span className="Filename">{file.name}</span>
                </div>
              );
            })}
            {this.state.files.length === 0 &&
            <ul>
              <li><FontAwesomeIcon icon={faUpload}/>&nbsp; Click the circle on the left to select CSV file
              </li>
              <br/>
              <br/>
              <li><FontAwesomeIcon icon={faDownload}/>&nbsp;Save PDF table of run results by clicking on "Download PDF"
              </li>
            </ul>}
          </div>
        </div>
        <div className="Actions">{this.renderActions()}</div>
      </div>
    );
  }
}

export default Upload;