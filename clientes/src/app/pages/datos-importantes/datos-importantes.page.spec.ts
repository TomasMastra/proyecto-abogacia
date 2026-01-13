import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatosImportantesPage } from './datos-importantes.page';

describe('DatosImportantesPage', () => {
  let component: DatosImportantesPage;
  let fixture: ComponentFixture<DatosImportantesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DatosImportantesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
