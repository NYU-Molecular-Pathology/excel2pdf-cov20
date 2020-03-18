export class CovidSample {
    constructor(name, well, marker, ctValue) {
        this.name = name;
        this.well = well;
        this.marker = marker;
        this.ctValue = ctValue;
    }
    getName() {
        return this.name;
    }

    getWell() {
        return this.well;
    }

    getMarker() {
        return this.marker;
    }
    getctValue() {
        return this.ctValue;
    }
}