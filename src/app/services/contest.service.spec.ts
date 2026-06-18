import { TestBed } from '@angular/core/testing';
import { ContestService } from './contest.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../environments/environment';

describe('ContestService', () => {
  let service: ContestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ContestService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ContestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all contests', () => {
    const mockContests = [
      { id: 1, name: 'Contest 1', overview: 'Overview 1', rules: 'Rules 1', start_time: '2023-01-01', end_time: '2023-01-02' }
    ];

    service.getAllContests().subscribe(contests => {
      expect(contests.length).toBe(1);
      expect(contests).toEqual(mockContests);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/contests`);
    expect(req.request.method).toBe('GET');
    req.flush(mockContests);
  });

  it('should fetch a single contest by id', () => {
    const mockContest = { id: 1, name: 'Contest 1', overview: 'Overview 1', rules: 'Rules 1', start_time: '2023-01-01', end_time: '2023-01-02' };

    service.getContestById(1).subscribe(contest => {
      expect(contest).toEqual(mockContest);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/contests/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockContest);
  });

  it('should allow joining a contest', () => {
    const mockMember = { id: 1, user_id: 1, contest_id: 1, result_points: null, result_place: null };

    service.joinContest(1).subscribe(member => {
      expect(member).toEqual(mockMember);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/contests/1/join`);
    expect(req.request.method).toBe('POST');
    req.flush(mockMember);
  });
});
