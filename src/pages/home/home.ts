import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import xml2js from 'xml2js'; 

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
    
  }

  load(http){
    this.http.get('https://service1.auris.com/vclec/mobileapps/623789211A/Services.asp?transaction_type=565&product_id=10053&ani_number=3055886662&response_type=03').
    subscribe(data => {
      console.log(data["_body"]);

      let parser = new xml2js.Parser(
      {
        trim: true,
        explicitArray: true
      });
      parser.parseString(data["_body"],function(err,result){
        console.log(result.Auris.PrepaidAccount[0].response_msg);
        for (let k in result.Auris.Record){
          console.log(result.Auris.Record[k].AccountPlanInfo[0].PlanName);
        }
                
      });
    });
  }   
}
