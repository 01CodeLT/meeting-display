import { Pipe, PipeTransform } from '@angular/core';
import { SafeHtml, SafeUrl, DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'sanitizer' })
export class SanitizerPipe implements PipeTransform {
    constructor(private _sanitizer: DomSanitizer) {}

    transform(value: any = '', type: string = 'text', interpolate: object = null): any {
        //Check value is not null
        if(value == null) { return null; }
        
        //Check if the string should be interpolated
        if (interpolate !== null) {
            let vars = value.match(/{{([\w.]+)}}/g) || [];
            vars.forEach((varPath) => {
                let varValue = interpolate;
                let keys = varPath.replace(/{{|}}/g, '').split('.');
                keys.forEach(key => { varValue = varValue[key]; });
                value = value.replace(varPath, varValue);
            });
        }

        //Remove script and style tags and trust html
        if(type == 'html') {
            value = value.replace(/style="(.*?)"/g, '')
            value = value.replace(/<script>(.*?)<\/script>/g, '');
            value = value.replace('href=', 'target="_blank" href=');
            value = value.replace('mceNonEditable"><object', 'mceNonEditable"><object style="width: 100%; height:auto; min-height: 600px;"')
            value = this._sanitizer.bypassSecurityTrustHtml(value);
        }

        //Trust as url
        if (type == 'url') {
            value = this._sanitizer.bypassSecurityTrustResourceUrl(value);
        }

        return value;
    }
}