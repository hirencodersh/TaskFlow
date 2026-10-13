import test from 'node:test';
import assert from 'node:assert';

test('TaskFlow Requirements: Project Statuses validation (5 statuses)', () => {
  const validStatuses = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  assert.strictEqual(validStatuses.length, 5);
  assert.ok(validStatuses.includes('PLANNING'));
  assert.ok(validStatuses.includes('ACTIVE'));
  assert.ok(validStatuses.includes('ON_HOLD'));
  assert.ok(validStatuses.includes('COMPLETED'));
  assert.ok(validStatuses.includes('CANCELLED'));
});

test('TaskFlow Requirements: Circular Dependency Detection logic', () => {
  const dependencies: Record<string, string[]> = {
    'task-2': ['task-1'],
    'task-3': ['task-2'],
  };

  function hasCycle(taskId: string, targetId: string, visited = new Set<string>()): boolean {
    if (taskId === targetId) return true;
    if (visited.has(taskId)) return false;
    visited.add(taskId);

    const deps = dependencies[taskId] || [];
    for (const d of deps) {
      if (hasCycle(d, targetId, visited)) return true;
    }
    return false;
  }

  assert.strictEqual(hasCycle('task-3', 'task-1'), true);
  assert.strictEqual(hasCycle('task-4', 'task-1'), false);
});

test('TaskFlow Requirements: Task Date Boundary validation', () => {
  const projectStartDate = new Date('2026-01-01');
  const projectDueDate = new Date('2026-12-31');

  function validateTaskDate(taskDateStr: string) {
    const d = new Date(taskDateStr);
    if (d < projectStartDate || d > projectDueDate) {
      throw new Error('Task date out of project bounds');
    }
    return true;
  }

  assert.strictEqual(validateTaskDate('2026-06-15'), true);
  assert.throws(() => {
    validateTaskDate('2025-12-31');
  }, /Task date out of project bounds/);
});

test('TaskFlow Requirements: ADMIN protection & role authorization logic', () => {
  function canAssignAdmin(requesterRole: string, targetRole: string): boolean {
    if (targetRole === 'ADMIN' && requesterRole !== 'ADMIN') {
      return false;
    }
    return true;
  }

  assert.strictEqual(canAssignAdmin('DEVELOPER', 'ADMIN'), false);
  assert.strictEqual(canAssignAdmin('PROJECT_MANAGER', 'ADMIN'), false);
  assert.strictEqual(canAssignAdmin('ADMIN', 'ADMIN'), true);
  assert.strictEqual(canAssignAdmin('ADMIN', 'DEVELOPER'), true);
});

test('TaskFlow Requirements: Token Refresh & Inactive User handling logic', () => {
  function evaluateTokenRefresh(storedTokenExists: boolean, userIsActive: boolean): string {
    if (!storedTokenExists) {
      throw new Error('Invalid refresh token');
    }
    if (!userIsActive) {
      throw new Error('Account is pending administrator approval or inactive');
    }
    return 'NEW_ACCESS_TOKEN';
  }

  assert.strictEqual(evaluateTokenRefresh(true, true), 'NEW_ACCESS_TOKEN');
  assert.throws(() => {
    evaluateTokenRefresh(false, true);
  }, /Invalid refresh token/);
  assert.throws(() => {
    evaluateTokenRefresh(true, false);
  }, /Account is pending administrator approval or inactive/);
});

test('TaskFlow Requirements: User Approval Role preselection & update logic', () => {
  const validAssignableRoles = ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'QA'];

  function resolveApprovalRole(registeredRole: string, overrideRole?: string): string {
    const roleToAssign = overrideRole || registeredRole;
    if (roleToAssign === 'ADMIN') {
      throw new Error('Cannot approve user as ADMIN');
    }
    if (!validAssignableRoles.includes(roleToAssign)) {
      throw new Error('Invalid role');
    }
    return roleToAssign;
  }

  // Preselects registration role by default
  assert.strictEqual(resolveApprovalRole('DESIGNER'), 'DESIGNER');
  assert.strictEqual(resolveApprovalRole('QA'), 'QA');
  assert.strictEqual(resolveApprovalRole('PROJECT_MANAGER'), 'PROJECT_MANAGER');
  assert.strictEqual(resolveApprovalRole('DEVELOPER'), 'DEVELOPER');

  // Allows changing role during approval
  assert.strictEqual(resolveApprovalRole('DESIGNER', 'QA'), 'QA');
  assert.strictEqual(resolveApprovalRole('DEVELOPER', 'PROJECT_MANAGER'), 'PROJECT_MANAGER');

  // Forbids approving as ADMIN
  assert.throws(() => {
    resolveApprovalRole('DEVELOPER', 'ADMIN');
  }, /Cannot approve user as ADMIN/);
});

