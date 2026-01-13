import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadosHonorariosPage } from './estados-honorarios.page';

describe('EstadosHonorariosPage', () => {
  let component: EstadosHonorariosPage;
  let fixture: ComponentFixture<EstadosHonorariosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EstadosHonorariosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
