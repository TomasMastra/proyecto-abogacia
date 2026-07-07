import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UmaPage } from './uma.page';

describe('UmaPage', () => {
  let component: UmaPage;
  let fixture: ComponentFixture<UmaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UmaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
