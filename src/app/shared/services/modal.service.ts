import { Injectable, ComponentFactoryResolver, Injector } from '@angular/core';
import { FuiModalService, TemplateModalConfig, ModalTemplate, ComponentModalConfig } from 'ngx-fomantic-ui';

@Injectable()
export class ModalService {

    options = {
        'settings': {
            config: {},
            import: () => {
                return import('../modals/settings/settings.component').then(c => c.SettingsComponent);
            }
        },
        'help': {
            config: { size: 'large' },
            import: () => {
                return import('../modals/help/help.component').then(c => c.HelpComponent);
            }
        }
    };

    constructor(
        public modalService: FuiModalService,
        private injector: Injector,
        private factoryResolver: ComponentFactoryResolver
    ) { }

    async open(name, ...params: any[]) {
        //Import component
        let modalComponent = await this.options[name].import();

        //Create modal
        const config = new ComponentModalConfig<any, string, string>(modalComponent);
        
        //Set any config values
        for (let setting in this.options[name].config) {
            config[setting] = this.options[name].config[setting];
        }

        //Open modal
        let modal = this.modalService.open(config);
        return modal;
    }
}