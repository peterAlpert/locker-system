import { Routes } from '@angular/router';
import { LockersComponent } from './Pages/lockers/lockers.component';
import { LockerInventoryComponent } from './Pages/inventoryLockers/locker-inventory/locker-inventory.component';

export const routes: Routes = [
    { path: '', redirectTo: '/lockers', pathMatch: 'full' },
    { path: 'lockers', component: LockersComponent },
    { path: 'locker-inventory', component: LockerInventoryComponent }

];
