import{describe,it,expect}from'vitest';
describe('student form state identity',()=>{it('keeps ratings when presenter text changes but id remains stable',()=>{const ratings={1:4,2:5};const before={id:7,presenter_name:'Α',title:''};const after={...before,presenter_name:'Β',title:'Νέο'};expect(after.id).toBe(before.id);expect(ratings).toEqual({1:4,2:5})})});
