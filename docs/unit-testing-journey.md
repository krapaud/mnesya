# Unit Testing Journey - Validation Functions

**Date:** February 13, 2026  
**Context:** Learning and implementing unit tests for authentication validation functions  
**Framework:** Jest with React Native  
**Coverage Achieved:** 100%

## Learning Objectives

I wanted to learn how to write professional unit tests for my application. After successfully implementing the authentication feature (frontend-backend integration), I decided it was important to add automated tests to ensure my validation logic works correctly.

## Setup Process

### 1. Installing Testing Dependencies

I started by installing the necessary testing libraries:

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest ts-jest --legacy-peer-deps
```

**What I learned:** The `--legacy-peer-deps` flag was necessary because of dependency conflicts in the React Native ecosystem.

### 2. Jest Configuration

I created the Jest configuration file (`jest.config.js`) to set up the testing environment:

**Initial Configuration:**

- Used `ts-jest` transformer for TypeScript files
- Configured `react-native` preset
- Set up module name mapping for image files
- Configured coverage collection from `src/**/*.{ts,tsx}` files

**Challenge Encountered:**
Initially, Jest couldn't parse JSX syntax in `.tsx` files when collecting coverage. I got errors like:

```
Support for the experimental syntax 'jsx' isn't currently enabled
```

**Solution:**
I updated the Jest configuration to use `babel-jest` instead of `ts-jest`:

```javascript
transform: {
  '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
}
```

I also added `transformIgnorePatterns` to handle React Native dependencies correctly.

### 3. TypeScript Configuration

I had to add Jest types to my `tsconfig.json` to resolve TypeScript errors in test files:

```json
{
  "compilerOptions": {
    "types": ["jest"]
  }
}
```

**What I learned:** TypeScript needs to know about Jest's global functions like `describe`, `test`, and `expect`.

## Writing the Tests

I wrote 17 comprehensive tests covering all validation functions in `src/utils/validation.ts`.

### Test Structure I Learned

Each test follows the AAA pattern:

1. **Arrange:** Set up test data
2. **Act:** Call the function being tested
3. **Assert:** Verify the result

**Example:**

```typescript
test('should return null for valid email', () => {
  // Arrange & Act
  const result = validateEmail('test@example.com');
  
  // Assert
  expect(result).toBe(null);
});
```

### Tests Implemented

#### 1. Email Validation Tests (5 tests)

I tested the `validateEmail` function with:

- ✅ **Valid email:** Returns `null` for 'test@example.com'
- ✅ **Too short:** Returns error for 'abc' (less than 5 chars)
- ✅ **Missing @:** Returns error for 'testexample.com'
- ✅ **Missing domain:** Returns error for 'test@'
- ✅ **Too long:** Returns error for 250+ character email

**Key lesson:** I learned to test both valid cases AND all edge cases (too short, too long, invalid format).

#### 2. Password Validation Tests (7 tests)

I tested the `validatePassword` function with:

- ✅ **Valid password:** Returns `null` for 'Password1!'
- ✅ **Too short:** 'Pass1!' (less than 8 chars)
- ✅ **No digit:** 'Password!' (missing number)
- ✅ **No uppercase:** 'password1!' (all lowercase)
- ✅ **No lowercase:** 'PASSWORD1!' (all uppercase)
- ✅ **No special char:** 'Password1' (missing $@#%*!~&)
- ✅ **Too long:** 21+ characters

**Challenge I faced:**
Initially, I used `'a'.repeat(21)` to test "password too long", but this created a password like "aaaaaaaaaaaaaaaaaaaaaPassword!" which is 30+ characters. I had to think about the test data more carefully.

**What I learned:** Test data needs to trigger exactly ONE validation rule at a time. For "too long", the password should be 21 characters but still valid in all other ways.

#### 3. Name Validation Tests (3 tests)

I tested the `validateName` function with:

- ✅ **Valid name:** Returns `null` for 'John'
- ✅ **Empty name:** Returns error for ''
- ✅ **Too long:** Returns error for 101 characters

**Important bug I fixed:**
My first test used `'a'.repeat(100)` to test "name too long", but the maximum is 100 characters, so I needed 101 characters to actually trigger the error! I changed it to `'a'.repeat(101)`.

**Key lesson:** Boundary testing requires values that EXCEED the limit, not values AT the limit.

#### 4. Password Match Tests (2 tests)

I tested the `validatePasswordMatch` function with:

- ✅ **Matching passwords:** Returns `null` for ('Password1!', 'Password1!')
- ✅ **Non-matching passwords:** Returns error for ('Password1!', 'Password2!')

**What I learned:** Simple comparison tests are just as important as complex validation tests.

## Debugging Process

### Issue 1: Wrong Error Messages

**Problem:** Some tests were failing because I expected the wrong error message.

**Example:**

```typescript
// ❌ Wrong expectation
expect(result).toBe('Name must be at most 100 characters');

// ✅ Correct expectation (with i18n key prefix)
expect(result).toBe('register.errors.Name must be at most 100 characters');
```

**Solution:** I looked at the actual validation function to see what error message keys it returns, then matched my test expectations exactly.

**What I learned:** Tests must match the EXACT return values from the code, including i18n key prefixes.

### Issue 2: TypeScript Errors in Test File

**Problem:** TypeScript didn't recognize Jest functions like `describe`, `test`, and `expect`.

**Solution:** Added `"jest"` to the `types` array in `tsconfig.json`.

**What I learned:** TypeScript needs explicit type declarations for testing frameworks.

### Issue 3: JSX Parsing Errors in Coverage

**Problem:** When running coverage, Jest couldn't parse JSX in `.tsx` component files.

**Solution:** Changed from `ts-jest` to `babel-jest` in the Jest configuration, allowing Babel to handle JSX transformation.

**What I learned:** Jest needs the right transformer for the file type. `babel-jest` handles both TypeScript AND JSX, while `ts-jest` only handles TypeScript.

## Test Results

### Final Test Run

```
Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        0.285 s
```

### Coverage Report

```
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
--------------|---------|----------|---------|---------|----------------
validation.ts |     100 |      100 |     100 |     100 |
```

**Achievement unlocked:** 🎯 **100% code coverage!**

This means:

- ✅ Every line of code is executed by at least one test
- ✅ Every branch (if/else) is tested
- ✅ Every function is called
- ✅ No untested code remains

## Key Takeaways

### What I Learned About Testing

1. **Test both success and failure cases:** Don't just test that valid input works; test all the ways it can fail.

2. **One assertion per test:** Each test should verify ONE specific behavior. This makes it easier to understand what broke when a test fails.

3. **Descriptive test names:** Use `should return error for password too short` instead of `test2`. When tests fail, the name tells you exactly what's broken.

4. **Boundary testing is crucial:** Test values at the limits (5 chars, 255 chars) AND beyond the limits (4 chars, 256 chars).

5. **Test data matters:** Create test data that triggers exactly ONE validation rule to isolate what you're testing.

6. **Read error messages carefully:** When tests fail, the error message usually tells you exactly what's wrong (expected vs actual values).

### Testing Best Practices I Discovered

- ✅ **Arrange-Act-Assert pattern** keeps tests organized
- ✅ **Test file naming:** `__tests__/validation.test.ts` keeps tests near the code
- ✅ **Test coverage as a goal:** Aim for 100% on critical code like validation
- ✅ **Fix configuration once:** Good Jest/Babel setup makes all future tests easier
- ✅ **Document as you go:** Understanding WHY tests exist helps maintain them

### Professional Development

I realized that writing tests is not just about "checking if code works". It's about:

1. **Documenting intended behavior:** Tests show how functions are supposed to work
2. **Preventing regressions:** If I change validation logic later, tests will catch breaking changes
3. **Design feedback:** Writing tests made me think about edge cases I hadn't considered
4. **Confidence:** I can now refactor validation.ts knowing tests will catch any mistakes

## Next Steps

Now that I understand unit testing, I want to:

1. ✅ Write tests for `authService.ts` (login, register, logout functions)
2. ✅ Write tests for `tokenService.ts` (token CRUD operations)
3. ✅ Learn component testing (testing React components with user interactions)
4. ✅ Set up automated test runs (CI/CD with GitHub Actions)
5. ✅ Learn about mocking (how to test code that calls APIs)

## Reflection

**What surprised me:**

- How fast tests run (0.285s for 17 tests!)
- How satisfying it is to see 100% coverage
- How tests helped me find a boundary condition bug (100 vs 101 characters)

**What was challenging:**

- Understanding the difference between `ts-jest` and `babel-jest`
- Getting the exact error message strings right
- Setting up Jest configuration for React Native

**What I'm proud of:**

- Writing 17 comprehensive tests independently
- Achieving 100% code coverage
- Understanding the AAA pattern
- Fixing configuration issues on my own (with guidance)

## Conclusion

Learning unit testing was one of the most valuable skills I've gained during this project. It changed how I think about code quality and gave me confidence that my validation logic works correctly in all scenarios.

The investment in learning Jest and testing best practices will pay off throughout the rest of this project and in my future development work.

---

**Total Tests Written:** 17  
**Code Coverage:** 100%  
**Time Invested in Learning:** ~2 hours  
**Bugs Found Through Testing:** 1 (boundary condition in name length)  
**Confidence Level:** High ✅
