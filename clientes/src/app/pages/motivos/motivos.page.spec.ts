import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotivosPage } from './motivos.page';

describe('MotivosPage', () => {
  let component: MotivosPage;
  let fixture: ComponentFixture<MotivosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MotivosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
