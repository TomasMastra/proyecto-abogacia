import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JurisprudenciasPage } from './jurisprudencias.page';

describe('JurisprudenciasPage', () => {
  let component: JurisprudenciasPage;
  let fixture: ComponentFixture<JurisprudenciasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(JurisprudenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
