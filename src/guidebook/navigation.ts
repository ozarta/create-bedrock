import type { Query } from './model.js';
export type Route=
 |{kind:'home'}|{kind:'processes';page:number}|{kind:'items';query:Query;page:number}
 |{kind:'item';id:string}|{kind:'recipes';itemId?:string;mode:'produces'|'uses'|'related'|'process';type?:string;page:number}
 |{kind:'links';id:string;page:number}|{kind:'families';page:number}|{kind:'recipe';id:string}|{kind:'technical';id:string;page:number}|{kind:'tutorials'}
 |{kind:'tutorial';id:string;step:number;feedback?:'verified'|'not_verified'}|{kind:'image';path:string;titleKey:string};
/** A bounded explicit stack preserves queries/pages and never recurses through UI promises. */
export class Navigation {
 private readonly routes:Route[]=[{kind:'home'}];
 get current():Route{return this.routes[this.routes.length-1]!;}
 get depth():number{return this.routes.length;}
 push(route:Route):void{if(this.routes.length>=64)this.routes.splice(1,1);this.routes.push(route);}
 replace(route:Route):void{this.routes[this.routes.length-1]=route;}
 back():boolean{if(this.routes.length===1)return false;this.routes.pop();return true;}
}
