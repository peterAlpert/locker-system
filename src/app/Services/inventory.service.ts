import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  baseUrl = 'http://wdlokerssystem.runasp.net/api/inventory';

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