import test from 'node:test';
import assert from 'node:assert/strict';
import { Leases } from '../build/scripts/kinetic/leases.js';
test('liveness heap refreshes a deadline without duplicating entries',()=>{
 const q=new Leases();q.set('a',5);q.set('b',7);q.set('a',10);
 assert.equal(q.size,2);assert.deepEqual(q.expired(6,10),[]);
 assert.deepEqual(q.expired(8,10),['b']);assert.deepEqual(q.expired(10,10),['a']);
});
test('liveness heap supports earlier deadlines, cancellation and bounded expiry',()=>{
 const q=new Leases();for(let i=0;i<500;i++)q.set(String(i),500-i);
 q.remove('499');q.set('0',0);
 assert.equal(q.expired(1000,7).length,7);assert.equal(q.size,492);
 const rest=q.expired(1000,1000);assert.equal(rest.length,492);assert.equal(q.size,0);
});
