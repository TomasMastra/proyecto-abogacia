import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NetworkStatusPage } from './network-status.page';

describe('NetworkStatusPage', () => {
  let component: NetworkStatusPage;
  let fixture: ComponentFixture<NetworkStatusPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
