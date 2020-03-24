import React, { Component } from "react";
import Dropzone from "../dropzone/Dropzone";
import "./Upload.css";
import Progress from "../progress/Progress";
import Report from "../download/Report";
import Email from "../notification/Email";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faUpload, faDownload} from '@fortawesome/fontawesome-free-solid'
import {faAddressCard} from "@fortawesome/fontawesome-free-regular";
import {faRedoAlt} from "@fortawesome/free-solid-svg-icons/faRedoAlt";
import Pdf from "react-to-pdf";

const Button = React.forwardRef((props, ref) => {
  return (
        <Pdf targetRef={ref} filename={Date().toString().split(" ").splice(2,3).join("-") + "-report.pdf"}
             options={{orientation: 'landscape', unit: 'mm', format: [850,1500]}}>
          {({ toPdf }) => <button onClick={toPdf}><FontAwesomeIcon icon={faDownload} />&nbsp;Download Test Results</button>}
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
      successfullUploaded: false
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
    this.state.files.forEach(file => {
      promises.push(this.sendRequest(file));
    });
    try {
      await Promise.all(promises);

      this.setState({ successfullUploaded: true, uploading: false });
    } catch (e) {
      // Not Production ready! Do some error handling here instead...
      this.setState({ successfullUploaded: true, uploading: false });
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

  renderProgress(file) {
    const uploadProgress = this.state.uploadProgress[file.name];
    if (this.state.uploading || this.state.successfullUploaded) {
      return (
        <div className="ProgressWrapper">
          <Progress progress={uploadProgress ? uploadProgress.percentage : 0} />
          <img
            className="CheckIcon"
            alt="done"
            src="check_circle.svg"
            style={{
              opacity:
                uploadProgress && uploadProgress.state === "done" ? 0.5 : 0
            }}
          />
        </div>
      );
    }
  }

  _refreshPage() {
    window.location.reload();
  }

  renderActions() {
    let docToPrint = React.createRef();
    if (this.state.successfullUploaded) {
      return (
          <div>
            <div>
              <Button ref={docToPrint} />&nbsp;&nbsp;&nbsp;
              <Email />&nbsp;&nbsp;&nbsp;
              <button onClick = {this._refreshPage} ><FontAwesomeIcon icon={faUpload} />&nbsp;Upload RT-PCR Data&nbsp;&nbsp;&nbsp;</button>
            </div>
            <div ref={docToPrint} className="ReportCard">
              <Report dataFromParent = {this.state.files}/>
            </div>
          </div>);
    } else {
      return (
        <button
          disabled={this.state.files.length < 1 || this.state.uploading}
          onClick={this.uploadFiles}
        >
          <FontAwesomeIcon icon={faUpload} />&nbsp;Submit
        </button>
      );
    }
  }

  render() {
    return (
      <div className="Upload">

        <span className="Title">Novel Coronavirus Disease (COVID-19) RT-PCR Report Maker&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <div className="topright"><img src="nyulangone-logo.png" className="LogoIcon" alt="NYULangone" align="right"/></div>

          </span>
        <div className="Content">
          <div>
            <Dropzone
              onFilesAdded={this.onFilesAdded}
              disabled={this.state.uploading || this.state.successfullUploaded}
            />
          </div>
          <div>

          </div>
          <div className="Files">
            {this.state.files.length > 0 && this.state.files.map(file => {
              return (
                <div key={file.name} className="Row">
                  <span className="Filename">{file.name}</span>
                  {this.renderProgress(file)}
                </div>
              );
            })}
            {this.state.files.length === 0 &&
              <ul>
                <li><FontAwesomeIcon icon={faUpload} />&nbsp;Upload: Click or drop a COVID CSV file into the dashed circle on the left, then click "Submit" button below</li>
                <li><FontAwesomeIcon icon={faDownload} />&nbsp;Save PDF table of run results by clicking on "Download Test Results" </li>
                <li><FontAwesomeIcon icon={faAddressCard} />&nbsp;Send notifications by clicking on "Email Test Results"</li>
                <li><FontAwesomeIcon icon={faRedoAlt} />&nbsp;Load new test data by clicking on "Upload RT-PCR data"</li>
              </ul>}
          </div>
        </div>
        <div className="Actions">{this.renderActions()}</div>
      </div>
    );
  }
}

export default Upload;