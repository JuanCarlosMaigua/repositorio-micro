import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import SignaturePad from 'signature_pad';
import {Router} from '@angular/router';

@Component({
  selector: 'app-transactions-signature',
  templateUrl: './transactions-signature.component.html',
  styles: [
  ]
})
export class TransactionsSignatureComponent implements OnInit, AfterViewInit  {

  emonicLocalStorageDataTemp = 'datosDeposit';
  @ViewChild('sPad', {static: true}) signaturePadElement;
  signaturePad: any;
  isSignEmpty = false;
  sizeW = (screen.width < 768)?(screen.width * 0.90):(screen.width * 0.25);
  sizeh = (screen.height < 768)? this.sizeW :(screen.height * 0.25);
  constructor(
    private router: Router,) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement,
      {
        minWidth: 1.5,
        maxWidth: 4
      });
  }


  clear() {
    this.signaturePad.clear();
  }


  download(dataURL, filename) {
    if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1) {
      window.open(dataURL);
    } else {
      const blob = this.dataURLToBlob(dataURL);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
    }
  }

  dataURLToBlob(dataURL) {
    // Code taken from https://github.com/ebidel/filer.js
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }

  savePNG() {
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
    } else {
      const dataURL = this.signaturePad.toDataURL();
      this.download(dataURL, 'signature.png');
    }
  }

  setSing() {
    if(this.signaturePad.isEmpty()){
      this.isSignEmpty = true;
    }else{
      const temp = JSON.parse(localStorage.getItem(this.emonicLocalStorageDataTemp));
      temp.sign = this.signaturePad.toDataURL();
      localStorage.setItem(this.emonicLocalStorageDataTemp, JSON.stringify(temp));
      this.router.navigateByUrl('/formulario-de-deposito');
    }
  }
}
