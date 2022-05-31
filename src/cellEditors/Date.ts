import { CellEditor } from './CellEditor';


export class Date extends CellEditor {
    // @ts-ignore
    private isChromium = window.chrome
    private winNav = window.navigator
    private vendorName = this.winNav.vendor
    private isOpera = this.winNav.userAgent.indexOf('OPR') > -1
    private isIEedge = this.winNav.userAgent.indexOf('Edge') > -1
    private isIOSChrome = this.winNav.userAgent.match('CriOS')
    private isChrome = !this.isIOSChrome &&
        this.isChromium !== null &&
        this.isChromium !== undefined &&
        this.vendorName === 'Google Inc.' &&
        this.isOpera == false &&
        this.isIEedge == false;
    // eslint-disable-line

    /**
     *
     */
    constructor(grid: any, options: any) {
        super(grid, options);
    }

    protected initProps(): void {
        var localizerName
        var usesDateInputControl = this.isChrome

        if (usesDateInputControl) {
            localizerName = 'chromeDate';
            this.template = '<input type="date">';
        } else {
            localizerName = 'date';
            this.template = '<input type="text" lang="{{locale}}">';

            this.selectAll = function () {
                var lastCharPlusOne = this.getEditorValue(undefined).length;
                this.input.setSelectionRange(0, lastCharPlusOne);
            };
        }

        this.localizer = this.grid.localization.get(localizerName);
    }
}
