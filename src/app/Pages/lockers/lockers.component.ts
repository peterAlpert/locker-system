import { InventoryService } from './../../Services/inventory.service';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LockerService } from '../../Services/locker.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Router, RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import { CairoBase64 } from '../../../../public/assets/Fonts/cairo-normal';


@Component({
  selector: 'app-lockers',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './lockers.component.html',
  styleUrl: './lockers.component.css'
})
export class LockersComponent {

  lockers: any[] = [];
  groupedLockers: any[] = [];

  selectedArea: number = 0;
  selectedGender: number = 1; // 

  selectedLocker: any = null;
  lockerDetails: any = null;

  showDetails = false;
  showBooking = false;

  bookingData = {
    name: '',
    membershipNumber: '',
    phone: '',
    type: 0, // Yearly = 0
    price: 0
  };

  bookingData2 = {
    number: 0,
    place: '',
  }

  leftSide: any[] = [];
  rightSide: any[] = [];

  searchText = '';
  highlightedLockers: any[] = [];

  hoveredLocker: any = null;
  hoveredLockerLockerId: number | null = null;

  allColumns: any[] = [];
  headerHeight = 0;

  isLoading = false;

  constructor(
    private lockerService: LockerService,
    private InventoryService: InventoryService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) { }


  ngOnInit() { }

  // ===================== LOAD =====================
  loadLockers() {
    if (this.selectedArea === null) return;
    this.isLoading = true;

    this.lockerService.getLockers(this.selectedArea, this.selectedGender)
      .subscribe({
        next: (data) => {
          this.isLoading = false;
          this.lockers = data || [];
          this.prepareLayout(this.lockers);
        },
        error: (err) => {
          console.error(err);
          console.log("API ERROR:", err);
        }
      });
  }

  get availableCount() {
    return this.lockers.filter(x => !x.isBooked).length;
  }

  get bookedCount() {
    return this.lockers.filter(x => x.isBooked).length;
  }

  // ===================== SELECT =====================

  selectLocker(locker: any) {
    if (!locker) return;

    this.selectedLocker = locker;

    if (this.isBooked(locker)) {
      // ✅ لو محجوز → افتح التفاصيل
      this.lockerService.getDetails(locker.id).subscribe(data => {
        this.lockerDetails = data;
        this.showDetails = true;
      });
    } else {

      this.bookingData = {
        name: '',
        membershipNumber: '',
        phone: '',
        type: 0,
        price: 0
      };
      this.calculatePrice();

      // ✅ لو فاضي → افتح الحجز
      this.showBooking = true;
    }
  }

  // ===================== GENDER =====================
  changeGender(gender: number) {
    this.selectedGender = gender;
    this.loadLockers();
  }

  // ===================== PRICE =====================
  calculatePrice() {
    if (!this.selectedLocker) return;

    const size = this.selectedLocker.size;
    const type = this.bookingData.type;

    if (size === 1) {
      this.bookingData.price = type === 0 ? 600 : 360;
    } else {
      this.bookingData.price = type === 0 ? 880 : 530;
    }
  }

  // ===================== BOOK =====================
  isSaving = false;
  saveBooking() {

    if (this.isSaving) return;
    this.isSaving = true;

    if (!this.bookingData.name ||
      !this.bookingData.membershipNumber ||
      !this.bookingData.phone) {

      Swal.fire({
        icon: 'warning',
        title: 'ناقص بيانات',
        text: 'من فضلك املأ كل البيانات ❗'
      });
      this.isSaving = false;
      return;
    }

    const request = {
      lockerId: this.selectedLocker.id,
      name: this.bookingData.name,
      membershipNumber: this.bookingData.membershipNumber,
      phone: this.bookingData.phone,
      type: Number(this.bookingData.type),
      price: this.bookingData.price
    };

    Swal.fire({
      title: 'جاري الحجز...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.lockerService.bookLocker(request).subscribe({
      next: () => {
        this.showBooking = false;

        this.bookingData = {
          name: '',
          membershipNumber: '',
          phone: '',
          type: 0,
          price: 0
        };

        Swal.fire({
          icon: 'success',
          title: 'تم الحجز 🎉',
          text: 'تم حجز اللوكر بنجاح',
          confirmButtonText: 'تمام',
          confirmButtonColor: '#28a745'
        });

        this.isSaving = false;
        this.loadLockers();

      },
      error: (err) => {

        console.log("FULL ERROR:", err);

        // 👇 لو هو already booked بس الحجز حصل فعلاً
        if (err.error === "اللوكر محجوز بالفعل") {
          Swal.fire({
            icon: 'success',
            title: 'تم الحجز (لكن فيه تكرار request)',
            text: 'متقلقش 👍'
          });

          this.showBooking = false;
          this.loadLockers();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: err.error || 'حصلت مشكلة'
          });
        }

        this.isSaving = false;
      }
    });
  }

  // ===================== STATUS =====================
  isBooked(locker: any) {
    return locker.isBooked;
  }


  // ===================== buildColumns =====================
  buildColumns(lockers: any[]) {
    const columns: any[] = [];
    let i = 0;

    while (i < lockers.length) {
      const current = lockers[i];

      if (!current) break;

      // 90 cm → 2
      if (current.size === 2 && lockers[i + 1]) {
        columns.push([lockers[i], lockers[i + 1]]);
        i += 2;
      }
      // 60 cm → 3
      else if (lockers[i + 2]) {
        columns.push([lockers[i], lockers[i + 1], lockers[i + 2]]);
        i += 3;
      }
      else {
        // 🔥 بدل ما نعمل عمود واحد
        // نضيفه للعمود اللي قبله
        if (columns.length > 0) {
          columns[columns.length - 1].push(lockers[i]);
        } else {
          columns.push([lockers[i]]);
        }
        i += 1;
      }
    }

    return columns;
  }

  // ===================== prepareLayout =====================
  prepareLayout(lockers: any[]) {
    this.allColumns = this.buildColumns(lockers);
  }


  // ===================== SEARCH =====================
  filterLockers() {
    if (!this.searchText) {
      this.highlightedLockers = [];
      return;
    }

    this.lockerService.search(this.searchText).subscribe(res => {
      this.highlightedLockers = res || [];
    });
  }

  recognition: any;

  startVoiceSearch() {

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      alert('المتصفح لا يدعم Voice Search');
      return;
    }

    this.recognition = new SpeechRecognition();

    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      console.log('🎤 جاري الاستماع...');
    };

    this.recognition.onresult = (event: any) => {

      const text = event.results[0][0].transcript;

      console.log(text);

      this.searchText = text;

      this.filterLockers();
    };

    this.recognition.start();
  }


  isHighlighted(locker: any) {
    return this.highlightedLockers.some(x => x.id === locker?.id);
  }

  // ================= HOVER & LEAVE =====================
  lockerCache: any = {};
  hoverTimeout: any;

  onHover(locker: any) {
    clearTimeout(this.hoverTimeout);

    this.hoverTimeout = setTimeout(() => {
      if (!locker || !this.isBooked(locker)) return;

      this.hoveredLockerLockerId = locker.id;

      this.lockerService.getDetails(locker.id).subscribe(data => {
        this.hoveredLocker = data;
      });
    }, 100); // delay بسيط
  }

  onLeave() {
    this.hoveredLocker = null;
    this.hoveredLockerLockerId = null;
  }

  // ===================== AREA =====================
  chooseArea(area: number) {
    this.selectedArea = -1;
    setTimeout(() => {
      this.isInventoryMode = false;
      this.selectedArea = area;

      this.selectedGender = 1;

      this.checkFemaleLockers();

      this.lockers = [];
      this.allColumns = [];
      this.cd.detectChanges();

      this.loadLockers();

    }, 250);
  }

  // ===================== AREA TITLE =====================
  getAreaTitle() {
    switch (this.selectedArea) {
      case 1: return '💪 الجيم';
      case 2: return '🧖‍♂️ النادي الصحي';
      case 3: return '🥊 القتالية';
      case 4: return '🏊‍♂️ الأولمبي';
      case 5: return '🛠️ الخدمات';
      default: return '';
    }
  }

  // ===================== FEMALE LOCKERS =====================
  hasFemaleLockers = false;
  checkFemaleLockers() {
    this.lockerService.hasFemale(this.selectedArea).subscribe(res => {
      this.hasFemaleLockers = res;
    });
  }

  // ===================== DETAILS =====================
  getTypeName(type: number) {
    return type === 0 ? 'سنوي' : 'نصف سنوي';
  }

  formatDate(date: any) {
    return new Date(date).toLocaleDateString('ar-EG');
  }


  showRenew = false;

  renewData = {
    type: 0,
    price: 0
  };

  renew() {
    this.showRenew = true;

    this.renewData = {
      type: this.lockerDetails?.type ?? 0,
      price: 0
    };

    this.calculateRenewPrice();
  }

  calculateRenewPrice() {

    if (!this.selectedLocker) return;

    const size = this.selectedLocker.size;
    const type = this.renewData.type;

    if (size === 60) {

      this.renewData.price =
        type === 0 ? 600 : 360;

    } else {

      this.renewData.price =
        type === 0 ? 880 : 530;
    }
  }

  confirmRenew() {

    const request = {

      lockerId: this.selectedLocker.id,

      type: Number(this.renewData.type),

      price: this.renewData.price
    };

    this.lockerService
      .renewLocker2(request)
      .subscribe({

        next: () => {

          this.printClearanceReport();

          Swal.fire(
            'تم التجديد 🎉',
            'تم تحديث الاشتراك بنجاح',
            'success'
          );

          this.showRenew = false;
          this.showDetails = false;

          this.loadLockers();
        },

        error: () => {

          Swal.fire(
            'خطأ',
            'فشل التجديد',
            'error'
          );
        }
      });
  }

  // renew() {
  //   Swal.fire({
  //     title: 'هل أنت متأكد؟',
  //     text: 'هل تريد تجديد الاشتراك؟',
  //     icon: 'question',
  //     showCancelButton: true,
  //     confirmButtonText: 'نعم',
  //     cancelButtonText: 'إلغاء'
  //   }).then((result) => {

  //     if (result.isConfirmed) {

  //       this.lockerService
  //         .renewLocker(this.selectedLocker.id)
  //         .subscribe({

  //           next: () => {

  //             this.printClearanceReport();

  //             Swal.fire(
  //               'تم التجديد 🎉',
  //               'تم تحديث تاريخ الاشتراك للسنة الجديدة',
  //               'success'
  //             );

  //             this.showDetails = false;

  //             this.loadLockers();
  //           },

  //           error: () => {
  //             Swal.fire('خطأ', 'فشل التجديد', 'error');
  //           }

  //         });

  //     }

  //   });
  // }

  cancelBooking() {

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم تحويل اللوكر إلى متاح',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم',
      cancelButtonText: 'إلغاء'
    }).then((result) => {

      if (result.isConfirmed) {

        this.lockerService
          .cancelLocker(this.selectedLocker.id)
          .subscribe({

            next: () => {

              Swal.fire(
                'تم الإلغاء ✅',
                'اللوكر أصبح متاح الآن',
                'success'
              );

              this.showDetails = false;

              this.loadLockers();
            },

            error: () => {
              Swal.fire('خطأ', 'فشل الإلغاء', 'error');
            }

          });

      }

    });

  }


  lockerTimers: any = {};
  toggleLocker(locker: any, event: MouseEvent) {

    event.stopPropagation();

    // ❌ المحجوز ميفتحش
    if (this.isBooked(locker)) {
      return;
    }

    // 🔄 فتح / قفل
    locker.isOpen = !locker.isOpen;

    // ❌ لو اتقفل يدوي امسح التايمر
    if (!locker.isOpen) {

      clearTimeout(this.lockerTimers[locker.id]);

      return;
    }

    // ✅ Auto Close بعد 5 ثواني
    this.lockerTimers[locker.id] = setTimeout(() => {

      locker.isOpen = false;
      this.playClickSound();

    }, 2500);

    this.playClickSound();
  }

  clickAudio = new Audio('assets/sounds/locker-click.mp3');

  playClickSound() {
    this.clickAudio.currentTime = 0;
    this.clickAudio.volume = 0.2;
    this.clickAudio.playbackRate = 1.2;
    this.clickAudio.play();
  }

  getLockerStatusClass(locker: any) {
    switch (locker.status) {
      case 1: return 'booked';
      case 2: return 'grace';
      case 3: return 'expired';
      case 4: return 'pending';
      default: return 'available';
    }
  }

  // ===================== INVENTORY =====================  
  isInventoryMode = false;
  inventories: any[] = [];
  selectedInventory: any = null;
  showInventoryDetails = false;
  focusedLocker: any = null;

  focusedLockerId: number | null = null;

  openInventoryPage() {
    this.isInventoryMode = true;
    this.selectedArea = 0;

    this.InventoryService.getInventories().subscribe(res => {
      this.inventories = res || [];
      console.warn(res);


      // 🔥 نفس توزيع اللوكرات
      this.allColumns = this.buildColumns(this.inventories);
    });
  }

  openInventoryDetails(inv: any) {
    // this.focusedLocker = inv;

    setTimeout(() => {
      this.selectedInventory = inv;
      this.showInventoryDetails = true;
    }, 300); // بعد الأنيميشن
  }

  toggleInventoryLocker(inv: any, event: MouseEvent) {

    event.stopPropagation();

    this.inventories.forEach(x => {

      if (x.id !== inv.id) {

        x.isOpen = false;
      }
    });

    inv.isOpen = !inv.isOpen;

    this.playClickSound();
  }


  focusLocker(locker: any) {
    this.focusedLocker = locker;
  }

  closeFocus() {
    this.focusedLocker = null;
    this.showInventoryDetails = false;
  }


  moveToInventory(selectedLocker: any) {

    this.showDetails = false;

    this.router.navigate(['/locker-inventory'], {
      state: {
        locker: selectedLocker
      }
    });

  }


  addNewInventory() {
    this.router.navigate(['/locker-inventory']);
  }


  printReceipt() {

    const printContents =
      document.getElementById('print-section')?.innerHTML;

    const popup = window.open('', '', 'width=900,height=700');

    popup?.document.write(`
    <html>

      <head>

        <meta charset="UTF-8">

        <title>Receipt</title>

        <style>

          body {

            font-family: Tahoma, Arial;
            direction: rtl;

            padding: 25px;
            color: #111;
          }

          .receipt-container {

            width: 350px;

            margin: auto;

            border: 2px solid #ddd;

            border-radius: 18px;

            padding: 20px;
          }

          .receipt-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            border-bottom: 1px solid #ddd;

            padding-bottom: 10px;

            margin-bottom: 20px;
          }

          .receipt-logo {

            width: 70px;
          }

          .receipt-title {

            flex: 1;
            text-align: center;
          }

          .receipt-row {

            display: flex;

            justify-content: space-between;

            margin: 12px 0;

            font-size: 15px;
          }

          .receipt-footer {

            text-align: center;

            margin-top: 25px;

            font-size: 13px;

            color: #666;
          }

        </style>

      </head>

      <body>

        ${printContents}

      </body>

    </html>
  `);

    popup?.document.close();

    popup?.focus();

    setTimeout(() => {

      popup?.print();

      popup?.close();

    }, 500);
  }

  toggleFullscreen() {

    if (!document.fullscreenElement) {

      document.documentElement.requestFullscreen();

    } else {

      document.exitFullscreen();
    }
  }


  deliverInventory() {

    Swal.fire({

      title: 'تأكيد التسليم',

      text: 'هل تم تسليم الأمانات للعضو؟',

      icon: 'question',

      showCancelButton: true,

      confirmButtonText: 'نعم تم التسليم',

      cancelButtonText: 'إلغاء'

    }).then((result) => {

      if (result.isConfirmed) {

        this.InventoryService
          .deliverInventory(this.selectedInventory.id)
          .subscribe({

            next: () => {

              Swal.fire({

                icon: 'success',

                title: 'تم التسليم ✅',

                text: 'تم تحديث الحالة بنجاح'

              });

              // تحديث مباشر
              this.selectedInventory.isDelivered = true;

              this.selectedInventory.deliveredDate =
                new Date();

              // تحديث الليست
              const inv = this.inventories.find(
                x => x.id === this.selectedInventory.id
              );

              if (inv) {

                inv.isDelivered = true;
              }

            },

            error: () => {

              Swal.fire(
                'خطأ',
                'فشل تحديث الحالة',
                'error'
              );
            }

          });

      }

    });
  }


  printClearanceReport() {


    const today = new Date().toLocaleDateString('ar-EG');

    const html = `
<!DOCTYPE html>
<html dir="rtl">

<head>

<meta charset="UTF-8">

<title>إستمــارة حجــز و إستغــلال لــوكر </title>

<style>

@page{
  size:A4;
  margin:3mm;
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
  display: flex;
  justify-content: flex-end; /* اللوجو شمال */
  margin-bottom: 10px;
}

.logo img{
  width: 70px;
}

.info-row{
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
  font-size: 14px;
  font-weight: bold;
}

.logo img{
  width:70px;
}

.header-text{
  text-align:right;
  font-size:15px;
  font-weight:bold;
  line-height:1.5;
}

.header{
  text-align:center;
  font-weight:bold;
  margin-bottom:10px;
}

.title{
  text-align:center;
  font-size:15px;
  font-weight:bold;
  margin:10px 0;
  text-decoration:underline;
}

.text{
  line-height:1.7;
  font-size:12px;
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

  <div class="logo">
    <img src="assets/logo.png">
  </div>

</div>

<div class="info-row">
  <span style="margin-left: 50px;">الحالة : </span>
  <span style="margin-right: 50px;">التاريخ : ${today}</span>
</div>

<div class="title">
إستمــارة حجــز و إستغــلال لــوكر
</div>

<div class="text">

شروط وقواعد حجز اللوكر: <br>


1.	يقر العضو بموافقته وعلمه وقبوله ورضائه بكافة الشروط الواردة بهذه الإستمارة.<br>
2.	تلغي هذه الإستمارة في حالة عدم سداد العضو مقابل إستغلال اللوكر المبين ادناة وإرفاق إيصال السداد بالإستمارة لدي الموظف المختص وذلك بحد أقصى يوم عمل واحد من التاريخ المدون بالاستمارة..<br>
3.	مدة هذه الاستمارة تبدا من تاريخ تحرير الاستمارة وسداد مقابل الاستغلال عن المدة الزمنية المحددة (سنوي - نصف سنوي) قابلة للتجديد (بموجب استمارة جديدة) بشرط أن يبدي العضو رغبته في التجديد خلال الفترة من  1 يناير حتى 31 يناير من العام المراد استغلال اللوكر به  (الفترة المحددة لتجديدات اللوكر)، على أن يقوم بسداد قيمة التجديد عن الفترة الجديدة وأية زيادات سنوية يقررها مجلس إدارة النادي وفي حالة تقاعس العضو عن السداد أو عن طلب تجديد مدة استغلال اللوكر يلتزم ويقر ويتعهد بأن يقوم بتسليم اللوكر خالي من أية متعلقات في تاريخ انتهاء المهلة المقررة للسداد، وفي حال تقاعس العضو عن تسليم اللوكر في الموعد المحدد أدناه ، يحق للنادي القيام بالتجديد التلقائي لحجز اللوكر ، ويتم اضافة مبلغ تجديد اللوكر الى المبلغ المستحق على العضو عند التجديد السنوي للعضوية.<br>
4.	لا يسمح بحجز اللوكر للأعضاء أقل من 16 سنة.<br>
5.	يُحق للعضو طلب إلغاء الحجز خلال أسبوع واحد من تاريخ الحجز والسداد، ويُسمح باستبدال اللوكر المحجوز (في حالة توافر لوكر بديل بنفس الحجم) خلال 15 يومًا من تاريخ الحجز، ويُسمح بالإلغاء أو الاستبدال مرة واحدة فقط خلال فترة الحجز، ولا يُقبل أي طلب إضافي بعد ذلك، ويُسمح بحجز أكثر من لوكر في جميع مناطق النادي ماعدا منطقة الجيم يُسمح بحجز لوكر واحد فقط.  <br>
6.	يقر العضو (مستغل اللوكر) بمسئوليته المسئولية الكاملة المدنية والجنائية عن كافة المتعلقات الموجودة داخل اللوكر المستغل من جانبه دون أدني مسئولية على إدارة النادى، أو على أي من العاملين به.<br>
7.	يقر العضو (مستغل اللوكر) أنه فى حالة إتلاف الوحدة أو تلفها او وضع أية ملصقات عليها أو تشويهها بأية طريقة أخرى أن يتم تقدير قيمة التلفيات عن طريق الإدارة الهندسية بالنادي ويقر العضو ويتعهد بتحملها كاملة وفى حالة مخالفته ذلك يحق للنادي مسائلته قانوناً أو مطالبته بقيمة التلفيات مع التجديد السنوي لاشتراك عضويته ذاتها، يقوم العضو بتوفير قفل خاص لغلق الوكر وفى حالة فقد المفتاح الخاص بة فعلى العضو (مستغل اللوكر) أن يخطر إدارة الأمن فور إكتشافه ، وذلك من أجل المعاونة فى تغيير القفل القديم دون حدوث اى تلفيات فى اللوكر -  فى حالة كان اللوكر مسلم للعضو بمفتاح وفقد المفتاح فعلى العضو (مستغل اللوكر) أن يخطر إدارة الأمن فور إكتشافه وذلك من أجل تغيير كالون اللوكر بآخر جديد مقابل المبالغ المقررة التى تحددها الإدارة الهندسية بالنادى، وفي حالة تقاعس العضو لأى سبب من الأسباب عن سداد مقابل الكالون الجديد يحق للنادي مطالبته قانوناً أو مطالبته بقيمة الكالون الجديد مع التجديد السنوي لاشتراك عضويته ذاتها."<br>
8.	مع عدم الإخلال بالبنود الواردة أعلاه حال أستمر العضو في عدم تجديد حجز اللوكر وعدم تجديد عضويته لمدة سنتين تجديد يفوض العضو النادي تفويض نهائي رضائي اتفاقي في تشكيل لجنة لفتح اللوكر وفض محتوياته وتخزينها وكل ذلك على حساب العضو، وتحمل كامل المستحقات على قيمة التجديد السنوي للعضوية.<br>
9.	لا يجوز للعضو التنازل عن اللوكر لأي عضو آخر تحت أي ظرف.<br>




<table border="4" style="width:75%; margin:10px 0; border-collapse: collapse; text-align:center;">
    <tr>
        <td style="height:25px;">رقم اللوكر</td>
        <td>${this.selectedLocker.number}</td>
    </tr>

    <tr>
        <td style="height:25px;">المكان</td>
        <td>  </td>
    </tr>

    <tr>
        <td style="height:25px;">اسم العضو</td>
        <td> ${this.selectedLocker.memberName} </td>
    </tr>

    <tr>
        <td style="height:25px;">رقم العضويه</td>
        <td> ${this.selectedLocker.membershipNumber} </td>
    </tr>

    <tr>
        <td style="height:25px;">رقم التلفون</td>
        <td> ${this.selectedLocker.phone} </td>
    </tr>

    <tr>
        <td style="height:25px;">تاريخ بدء الحجز</td>
        <td> 1-1-2026 </td>
    </tr>

    <tr>
        <td style="height:25px;">تاريخ انتهاء الحجز</td>
        <td> 31-12-2026 </td>
    </tr>

    <tr>
        <td style="height:25px;">المدة</td>
        <td> سنه </td>
    </tr>

    <tr>
        <td style="height:25px;">قيمة تجديد 2026</td>
        <td>  </td>
    </tr>

    
</table>





<span class="spac6">توقيع العضو :</span> <span class="spac6">توقيع الاداري  :</span> 



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

  printReport() {

    this.lockerService.getLockerReport().subscribe(data => {

      const rows = data.map(x => `
      <tr>
        <td>${x.bookingType}</td>
        <td>${x.phone}</td>
        <td>${x.memberName}</td>
        <td>${x.isBooked}</td>
        <td>${x.membershipNumber}</td>
        <td>${x.lockerNumber}</td>
        <td>${x.position}</td>
        <td>${x.size}</td>
        <td>${x.gender}</td>
        <td>${x.area}</td>
        <td>ِAssiut</td>
      </tr>
    `).join('');

      const win = window.open('', '_blank');

      win?.document.write(`
      <html dir="rtl">
      <head>
      <title>تقرير اللوكرات</title>

      <style>

      body{
        font-family:Tahoma;
        padding:5px;
      }

      table{
        width:100%;
        border-collapse:collapse;
      }

      th,td{
        border:1px solid #000;
        padding:2px;
        text-align:center;
      }

      th{
        background:#eee;
      }

      </style>

      </head>

      <body>

      <h2 style="text-align:center">
        تقرير جميع اللوكرات
      </h2>

      <table>

      <tr>
        <th>نوع الاشتراك</th>
        <th>الموبايل</th>
        <th>اسم العضو</th>
        <th>محجوز</th>
        <th>رقم العضوية</th>
        <th>رقم اللوكر</th>
        <th>المكان</th>
        <th>الحجم</th>
        <th>النوع</th>
        <th>المنطقة</th>
        <th>النادي</th>
      </tr>

      ${rows}

      </table>

      </body>
      </html>
    `);

      win?.document.close();

      setTimeout(() => {
        win?.print();
      }, 500);

    });

  }

}


