import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
 

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  posts : any;
  
  constructor(public navCtrl: NavController, public http: Http) {
       this.http.get('https://service1.auris.com/vclec/mobileapps/623789211A/Services.asp?transaction_type=563&product_id=10053&ani_number=3055886662').subscribe(data => {
        //this.posts = data.data.children;
        console.log(data);
    });
  }

}
