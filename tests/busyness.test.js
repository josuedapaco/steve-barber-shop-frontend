import { it, expect, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BusynessMeter from '../src/components/BusynessMeter.vue';
import { language } from '../src/lib/state';
let wrapper;
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const response = data => Promise.resolve({ok:true,json:async()=>data});
it('shows the shared percentage and translated public label without editing controls', async () => {
  language.value='es';
  vi.stubGlobal('fetch',vi.fn(()=>response({percentage:80,updatedAt:'2026-10-19T13:00:00-04:00'})));
  wrapper=mount(BusynessMeter); await flushPromises();
  expect(wrapper.find('meter').attributes('value')).toBe('80');
  expect(wrapper.text()).toContain('Muy ocupado');
  expect(wrapper.find('input').exists()).toBe(false);
});
it('changes the saved meter only when staff accepts the new percentage', async () => {
  language.value='en';
  vi.stubGlobal('fetch',vi.fn((url,options)=>response({percentage:options.method==='POST'?JSON.parse(options.body).percentage:20,updatedAt:null})));
  wrapper=mount(BusynessMeter,{props:{editable:true}}); await flushPromises();
  await wrapper.find('input[type=range]').setValue('55');
  expect(wrapper.find('meter').attributes('value')).toBe('20');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(wrapper.find('button').text()).toBe('Accept');
  await wrapper.find('form').trigger('submit'); await flushPromises();
  expect(fetch).toHaveBeenCalledWith('/api/staff/busyness',expect.objectContaining({method:'POST',body:'{"percentage":55}'}));
  expect(wrapper.find('meter').attributes('value')).toBe('55');
  expect(wrapper.text()).toContain('Moderately busy');
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

it('loads once without polling or rereading on focus', async () => {
  vi.useFakeTimers({toFake:['setInterval','clearInterval']});
  vi.stubGlobal('fetch',vi.fn(()=>response({percentage:20,updatedAt:null})));
  wrapper=mount(BusynessMeter); await flushPromises();
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(120000);
  window.dispatchEvent(new Event('focus'));
  await flushPromises();
  expect(fetch).toHaveBeenCalledTimes(1);
});
