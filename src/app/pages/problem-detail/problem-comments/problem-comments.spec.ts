import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProblemComments } from './problem-comments';

describe('ProblemComments', () => {
  let component: ProblemComments;
  let fixture: ComponentFixture<ProblemComments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemComments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemComments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
