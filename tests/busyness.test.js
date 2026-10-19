import { it, expect, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BusynessMeter from '../src/components/BusynessMeter.vue';
import { language } from '../src/lib/state';
let wrapper;
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals(); });
const response = data => Promise.resolve({ok:true,json:async()=>data});
it('shows the shared percentage and translated public label without editing controls', async () => {
  language.value='es';
  vi.stubGlobal('fetch',vi.fn(()=>response({percentage:80,updatedAt:'2026-10-19T13:00:00-04:00'})));
  wrapper=mount(BusynessMeter); await flushPromises();
  expect(wrapper.find('meter').attributes('value')).toBe('80');
  expect(wrapper.text()).toContain('Muy ocupado');
  expect(wrapper.find('input').exists()).toBe(false);
});
it('allows staff to preview and save a percentage', async () => {
  language.value='en';
  vi.stubGlobal('fetch',vi.fn((url,options)=>response({percentage:options.method==='POST'?JSON.parse(options.body).percentage:20,updatedAt:null})));
  wrapper=mount(BusynessMeter,{props:{editable:true}}); await flushPromises();
  await wrapper.find('input[type=range]').setValue('55');
  expect(wrapper.text()).toContain('Moderately busy');
  await wrapper.find('form').trigger('submit'); await flushPromises();
  expect(fetch).toHaveBeenCalledWith('/api/staff/busyness',expect.objectContaining({method:'POST',body:'{"percentage":55}'}));
  expect(wrapper.text()).toContain('Busyness updated on the website.');
  expect(wrapper.find('button').attributes('disabled')).toBeDefined();
});
it('does not invent a value before staff first reports busyness', async () => {
  language.value='en';
  vi.stubGlobal('fetch',vi.fn(()=>response({percentage:null,updatedAt:null})));
  wrapper=mount(BusynessMeter); await flushPromises();
  expect(wrapper.text()).toContain('Not updated yet');
  expect(wrapper.text()).not.toContain('Not too busy');
});
