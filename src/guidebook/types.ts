export type Availability='functional'|'partial'|'upcoming';
export type Scope='bedrock'|'java';
export interface Category {id:string;nameKey:string;icon:string}
export interface GuideItem {
 id:string;nativeId:string;scope:Scope;kind:'item'|'fluid'|'tag'|'selector';category:string;
 nameKey:string;names:{es_MX:string;en_US:string};icon:string;status:Availability;implemented:boolean;
 descriptionKey:string;operationKey:string;energyKey:string;exampleKey:string;errorsKey:string;
}
export interface Ingredient {options:string[];count:number|null;unit:'item'|'mB'|'unknown';role:'consumed'|'catalyst'}
export interface Output {itemId:string;count:number;unit:'item'|'mB';chance?:number;chanceMode:'certain'|'independent'|'weight'}
export type Technical=string|number|boolean|null|Technical[]|{[key:string]:Technical};
export interface Recipe {
 id:string;scope:Scope;status:Availability;implemented:boolean;gameVerified:boolean;type:string;machineId:string;
 inputs:Ingredient[];outputs:Output[];conditions:{key:string;value?:string}[];pattern?:string[];
 steps?:{type:string;machineId:string;inputs:Ingredient[];outputs:Output[]}[];loops?:number;
 source:string;technical:Technical;partialModel:boolean;
}
export interface Machine {id:string;itemId:string;implemented:boolean;builtin:boolean}
export interface TutorialStep {titleKey:string;bodyKey:string;image:string;related:string[];check?:{itemId:string;mode:'look'|'running'|'overloaded'|'idle';rpm?:number;capacity?:number;stress?:number;axis?:'x'|'y'|'z'}}
export interface Tutorial {id:string;titleKey:string;steps:TutorialStep[]}
export interface CatalogData {
 processes:{id:string;nameKey:string}[];resourcePackId:string;categories:Category[];items:GuideItem[];recipes:Recipe[];machines:Machine[];tutorials:Tutorial[];
 tagMembers:Record<string,string[]>;reference:{commit:string;count:number;runtimeFullyEnumerated:boolean;dynamicFamilies:{id:string;source:string;descriptionKey:string}[]};
}
