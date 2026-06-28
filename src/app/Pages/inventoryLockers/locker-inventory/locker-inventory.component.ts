import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../Services/inventory.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { LockerService } from '../../../Services/locker.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-locker-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './locker-inventory.component.html',
  styleUrl: './locker-inventory.component.css'
})
export class LockerInventoryComponent implements OnInit {

  lockerId: number | null = null;

  inventory: any = {
    number: null,
    building: '',
    place: '',
    memberName: '',
    membershipNumber: '',
    items: []
  };

  constructor(
    private inventoryService: InventoryService,
    private lockerService: LockerService,
    private router: Router
  ) { }

  ngOnInit(): void {

    const data = history.state.locker;
    console.warn(data);


    if (data) {
      this.lockerId = data.id;
      console.warn(data);

      switch (data.area) {
        case 1:
          this.inventory.building = ' المبني الاجتماعي';
          this.inventory.place = 'الجيم';
          break;
        case 2:
          this.inventory.building = 'مجمع السباحه';
          this.inventory.place = 'النادي الصحي';
          break;
        case 3:
          this.inventory.building = 'المبني الرياضي ';
          this.inventory.place = 'الصالات القتاليه';
          break;
        case 4:
          this.inventory.building = 'مجمع السباحه';
          this.inventory.place = 'الاولمبي ';
          break;
        case 5:
          this.inventory.building = 'مبني الخدمات  ';
          this.inventory.place = 'الخدمات';
          break;
      }

      this.inventory.number = data.number;
      this.inventory.memberName = data.memberName;
      this.inventory.membershipNumber = data.membershipNumber;

    }

  }

  addItem() {
    this.inventory.items.push({
      name: ''
    });
  }

  removeItem(index: number) {
    this.inventory.items.splice(index, 1);
  }

  saveInventory() {

    const inventoryData = {
      number: this.inventory.number,
      building: this.inventory.building,
      place: this.inventory.place,
      memberName: this.inventory.memberName,
      membershipNumber: '00400' + this.inventory.membershipNumber,
      items: this.inventory.items
    };

    console.log('Inventory Data:', inventoryData);
    console.log('Locker Id:', this.lockerId);

    Swal.fire({
      title: 'تأكيد حفظ الجرد',
      text: 'هل أنت متأكد من حفظ الأمانات وفض اللوكر؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم حفظ',
      cancelButtonText: 'إلغاء'
    }).then((result) => {

      if (!result.isConfirmed) {
        return;
      }

      this.inventoryService.createInventory(inventoryData)
        .subscribe({

          next: (res) => {

            console.log('Inventory Saved:', res);

            if (this.lockerId == null) {

              Swal.fire({
                icon: 'success',
                title: res.message || 'تم حفظ الأمانات بنجاح',
                showConfirmButton: false,
                timer: 1500
              });

              return;
            }

            console.log('Calling CancelLocker API...');

            this.lockerService.cancelLocker(this.lockerId)
              .subscribe({

                next: (lockerRes) => {

                  console.log('Locker Released:', lockerRes);

                  this.printClearanceReport();

                  Swal.fire({
                    icon: 'success',
                    title: 'تم حفظ الأمانات وفض اللوكر بنجاح ✅',
                    showConfirmButton: false,
                    timer: 1500
                  });

                  this.router.navigate(['/lockers']);

                  this.inventory = {
                    number: null,
                    building: '',
                    place: '',
                    memberName: '',
                    membershipNumber: '',
                    items: []
                  };

                },

                error: (err) => {

                  console.error('Cancel Locker Error:', err);

                  Swal.fire({
                    icon: 'warning',
                    title: 'تم حفظ الأمانات ولكن لم يتم فض اللوكر',
                    text: err?.error?.message || 'يرجى مراجعة النظام'
                  });

                }

              });

          },

          error: (err) => {

            console.error('Create Inventory Error:', err);

            Swal.fire({
              icon: 'error',
              title: 'فشل حفظ الأمانات',
              text: err?.error?.message || 'حدث خطأ أثناء الحفظ'
            });

          }

        });

    });

  }


  printClearanceReport() {

    const itemsHtml = this.inventory.items
      .map((x: any, i: number) =>
        `<div>${i + 1}- ${x.name}</div>`)
      .join('');

    const today = new Date().toLocaleDateString('ar-EG');

    const html = `
<!DOCTYPE html>
<html dir="rtl">

<head>

<meta charset="UTF-8">

<title>محضر فتح لوكر</title>

<style>

@page{
  size:A4;
  margin:5mm;
}

.page {
  border: 5px double #000;
  min-height:95vh;
  padding: 5mm;
  box-sizing: border-box;
}

body{
  font-family:Tahoma;
  direction:rtl;
  color:#000;
}

.logo{
  text-align:center;
  margin-bottom:10px;
}

.top-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}

.logo img{
  width:70px;
}

.header-text{
  text-align:right;
  font-size:18px;
  font-weight:bold;
  line-height:1.8;
}

.header{
  text-align:center;
  font-weight:bold;
  margin-bottom:20px;
}

.title{
  text-align:center;
  font-size:24px;
  font-weight:bold;
  margin:20px 0;
  text-decoration:underline;
}

.text{
  line-height:1.8;
  font-size:16px;
}

.committee{
  margin:15px 0;
}

.committee div{
  margin:8px 0;
}

.items{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 2px;
}

.item{
  text-align: center;
}

.manager{
  margin-top:10px;
  text-align:left;
  font-weight:bold;
}

.page-break{
  page-break-before:always;
}

.signature{
  margin-top:80px;
}
.spac6{
margin-left:200px;
}
.space4{
  margin-left:150px;
  }

</style>

</head>

<body>

<div class="page">

<div class="top-header">

  <div class="header-text">
    شركة أندية وادي دجلة<br>
    قطاع التشغيل - نادي أسيوط
  </div>

  <div class="logo">
    <img src="assets/logo.png">
  </div>

</div>

<div class="title">
محضر فتح لوكر رقم (${this.inventory.number}) - المكان (${this.inventory.place})
</div>

<div class="text">

إنه بتاريخ ${today}

تم تشكيل لجنة من كلاً من :-

<div class="committee">
<div><span class="spac6">1) السيد /  </span><span class="spac6"> --  الوظيفة :  </span></div>
<div><span class="spac6">2) السيد /  </span><span class="spac6"> --  الوظيفة :  </span></div>
<div><span class="spac6">3) السيد /  </span><span class="spac6"> --  الوظيفة :  </span></div>
</div>

تم الإنتقال للفحص والمعاينة وتبين أن الوحدة رقم
(${this.inventory.number})

وموقعها بمنطقة

(${this.inventory.place}) <br>

الخاصة بالعضو

(${this.inventory.memberName})

عضوية رقم

(${this.inventory.membershipNumber})

وبموجب شروط وقواعد حجز اللوكر الموقعة من العضو
والتي يقر فيها بضرورة الحضور للإدارة للتجديد
أو تسليم اللوكر الخاص به.

وفي حالة عدم التجديد يحق لإدارة النادي
فض اللوكر وتخزين محتوياته على حساب العضو. <br>

وعليه تم تشكيل اللجنة السابقة دون أدنى مسئولية
على إدارة النادي وتم فض الوحدة وحصر محتوياتها
على النحو التالي:

<div class="items">
${itemsHtml}
</div>

تم التحفظ على جميع المحتويـــات الخاصـــة بالوحدة وتم تسليمها كأمانات للعميد / ياسر محمد عطيه مهران -
مدير إدارة الأمن لحين تسليمها لمالكها .

</div>

<table border="2" style="width:100%; margin:10px 0; border-collapse: collapse; text-align:center;">
    <tr>
        <th>الاسم</th>
        <th>التوقيع</th>
    </tr>

    <tr>
        <td style="height:25px; text-align:start">1</td>
        <td></td>
    </tr>

    <tr>
        <td style="height:25px; text-align:start">2</td>
        <td></td>
    </tr>

    <tr>
        <td style="height:25px; text-align:start">3</td>
        <td></td>
    </tr>
</table>

<div class="manager">
مدير النادي
</div>

<h4 style="text-align:center; text-decoration:underline;">
إقرار استلام
</h4>
<p>
أقر أنا العضو : ${this.inventory.memberName} -- عضوية رقم :${this.inventory.membershipNumber}
</p>

<p>
بإستلام كافة محتويات اللوكر رقم : (${this.inventory.number}) -- بمنطقة : (${this.inventory.place}) الخاص بى كاملة.
</p>

<p>
وهذا إقرار مني بذلك.
</p>

<span class="space4">التوقيع :</span> <span class="space4">عضويه رقم :</span> <span class="space4">التاريخ :</span>



</div>
</div>

</body>
</html>
`;

    const win = window.open('', '_blank');

    win?.document.write(html);

    win?.document.close();

    setTimeout(() => {
      win?.print();
    }, 500);

  }
}
