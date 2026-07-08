import { TestBed } from '@angular/core/testing';

import { ReintegrosService } from './reintegros.service';

describe('ReintegrosService', () => {
  let service: ReintegrosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReintegrosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
