import React, { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faMailBulk} from '@fortawesome/free-solid-svg-icons';

class Email extends Component {
    constructor(props){
        super(props);
        this.onClick = this.onClick.bind(this);
    }
    onClick(){
        window.location.href = `mailto:${this.props.email}`;
    }
    render(){
        return <button onClick={this.onClick}><FontAwesomeIcon icon={faMailBulk} />&nbsp;Email Test Results&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button>;
    }
}

export default Email;