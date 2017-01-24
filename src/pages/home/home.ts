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
  Myhttp : Http;
  
  constructor(public navCtrl: NavController, public http: Http) {
    console.log("Constructor called");    
    this.Myhttp = http;
    this.load(this.Myhttp);
  }

  load(http){
    this.http.get('location/of/data').map(res => res.json()).subscribe(data => {
    console.log(data);
    });
  }   
}
