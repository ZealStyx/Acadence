/** Read the current preference, migrating the previous key if present. */
export function guideIsOpen(storage:Pick<Storage,'getItem'|'setItem'>,key:string,legacyKey:string):boolean {
 const current=storage.getItem(key);
 if(current!==null)return current!=='closed';
 const previous=storage.getItem(legacyKey);
 if(previous!==null){try{storage.setItem(key,previous)}catch{/* Reading the previous preference is still useful if storage is full. */}}
 return previous!=='closed';
}
