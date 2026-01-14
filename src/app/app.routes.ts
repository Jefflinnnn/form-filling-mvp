import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { FormFillingComponent } from './components/form-filling/form-filling';
import { FormsList } from './components/forms-list/forms-list';
import { FormSelector } from './components/form-selector/form-selector';
import { FormReview } from './components/form-review/form-review';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: Dashboard },
    { path: 'new-form', component: FormSelector },
    { path: 'form/isp-2519', component: FormFillingComponent },
    { path: 'review/:formId', component: FormReview },
    { path: 'forms', component: FormsList },
];
