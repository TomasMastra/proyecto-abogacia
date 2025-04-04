import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HonorarioDiferidoPage } from './honorario-diferido.page';

describe('HonorarioDiferidoPage', () => {
  let component: HonorarioDiferidoPage;
  let fixture: ComponentFixture<HonorarioDiferidoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HonorarioDiferidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
