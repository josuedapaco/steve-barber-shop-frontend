import { it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LocationMap from '../src/components/LocationMap.vue';

it('opens map choices on tap and closes after choosing directions', async () => {
  const wrapper = mount(LocationMap);
  const dialog = wrapper.find('dialog').element;
  dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
  dialog.close = vi.fn(() => dialog.removeAttribute('open'));
  expect(dialog.hasAttribute('open')).toBe(false);
  await wrapper.find('.map-open').trigger('click');
  expect(dialog.showModal).toHaveBeenCalledOnce();
  expect(dialog.hasAttribute('open')).toBe(true);
  const choices = wrapper.findAll('.maps-choices a');
  expect(choices.map(a => a.text())).toEqual(['Google Maps', 'Apple Maps']);
  expect(choices[0].attributes('href')).toContain('maps.app.goo.gl/');
  expect(choices[1].attributes('href')).toContain('maps.apple.com/');
  choices[1].element.addEventListener('click', event => event.preventDefault());
  await choices[1].trigger('click');
  expect(dialog.close).toHaveBeenCalledOnce();
  expect(dialog.hasAttribute('open')).toBe(false);
  wrapper.unmount();
});
