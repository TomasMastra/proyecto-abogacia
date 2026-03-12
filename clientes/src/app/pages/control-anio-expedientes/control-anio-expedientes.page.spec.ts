import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlAnioExpedientesPage } from './control-anio-expedientes.page';

describe('ControlAnioExpedientesPage', () => {
  let component: ControlAnioExpedientesPage;
  let fixture: ComponentFixture<ControlAnioExpedientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlAnioExpedientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
