import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultasOficioPage } from './consultas-oficio.page';

describe('ConsultasOficioPage', () => {
  let component: ConsultasOficioPage;
  let fixture: ComponentFixture<ConsultasOficioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultasOficioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
