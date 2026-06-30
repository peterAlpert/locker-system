import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LockerService {

  baseUrl = 'https://wdlokerssystem.runasp.net/api/Loker';
  baseUrl2 = 'https://wdlokerssystem.runasp.net/api';

  constructor(private http: HttpClient) { }

  getLockers(area: number, gender: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/by-area?area=${area}&gender=${gender}`
    );
  }

  getDetails(id: number) {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  bookLocker(data: any) {
    return this.http.post(`${this.baseUrl}/book`, data);
  }

  search(text: string) {
    return this.http.get<any[]>(
      `${this.baseUrl}/search?text=${text}`
    );
  }

  hasFemale(area: number) {
    return this.http.get<boolean>(`${this.baseUrl}/has-female?area=${area}`);
  }

  renewLocker(id: number) {
    return this.http.put(`${this.baseUrl}/renew/${id}`, {});
  }

  cancelLocker(id: number) {
    return this.http.put(
      `${this.baseUrl}/cancel/${id}`,
      {},
      { responseType: 'text' }
    );
  }

  renewLocker2(data: any) {
    return this.http.put(
      `${this.baseUrl}/renew`,
      data
    );
  }

  getLockerReport() {
    return this.http.get<any[]>(
      `${this.baseUrl}/report`
    );
  }
}