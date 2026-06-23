import { TestBed } from '@angular/core/testing';

import { ResumeAnalyzerService } from './resume-analyzer.service';

describe('ResumeAnalyzerService', () => {
  let service: ResumeAnalyzerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResumeAnalyzerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
