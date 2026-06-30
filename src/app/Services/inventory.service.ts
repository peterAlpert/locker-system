import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

interface InventoryItem {
  name: string;
}

interface LockerInventory {
  id?: number;

  number: number;

  building: string;
  place: string;

  memberName: string;
  membershipNumber: string;

  inventoryDate?: Date;

  isDelivered?: boolean;

  items: InventoryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  // baseUrl = 'https://wdlokerssystem.runasp.net/api/inventory';
  baseUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  createInventory(data: LockerInventory): Observable<any> {
    return this.http.post(`${this.baseUrl}`, data);
  }

  getInventories(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  deliverInventory(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/deliver/${id}`, {}
    )

  }
}