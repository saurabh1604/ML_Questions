import re

PREAMBLE = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[margin=1in]{geometry}
\usepackage{amsmath,amssymb,amsthm}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows,positioning,backgrounds,calc,intersections,patterns}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}

% Define colors
\definecolor{primary}{RGB}{0, 76, 153}       % Dark Blue
\definecolor{secondary}{RGB}{235, 245, 255}   % Light Blue
\definecolor{accent}{RGB}{255, 128, 0}        % Orange
\definecolor{solutionbg}{RGB}{245, 255, 245}  % Very Light Green
\definecolor{solutionborder}{RGB}{0, 153, 76} % Green

% Define Question Box
\newtcolorbox[auto counter, number within=section]{question}[1][]{
    enhanced,
    breakable,
    colback=secondary,
    colframe=primary,
    fonttitle=\bfseries,
    title=Question~\thetcbcounter: #1,
    attach boxed title to top left={yshift*=-\tcboxedtitleheight/2, xshift=5mm},
    boxed title style={colback=primary, sharp corners},
    boxrule=0.5mm,
    top=4mm,
    bottom=2mm
}

% Define Solution Box
\newtcolorbox{solution}{
    enhanced,
    breakable,
    colback=solutionbg,
    colframe=solutionborder,
    title=Solution,
    fonttitle=\bfseries,
    coltitle=white,
    attach boxed title to top left={yshift*=-\tcboxedtitleheight/2, xshift=5mm},
    boxed title style={colback=solutionborder, rounded corners},
    boxrule=0.5mm,
    top=4mm,
    bottom=2mm,
    before upper={\par\vspace{2mm}},
}

\title{\textbf{\Huge Machine Learning Practice Problems}}
\author{Prof. Saurabh}
\date{\today}

\begin{document}
\maketitle
\tableofcontents
\newpage
"""

def clean_text(text):
    # Remove page numbers and other artifacts
    text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
    text = text.replace("--- END OF MFML_Practice_Questions_Final.pdf ---", "")
    # Fix common extraction errors like "LetA=" to "Let A ="
    text = re.sub(r'LetA=', 'Let $A=', text)
    text = re.sub(r'Let\s*([A-Za-z])=', r'Let $\1=', text)
    text = re.sub(r'([A-Za-z0-9])=\\begin', r'\1= \\begin', text)

    # Fix matrix formatting from extraction
    text = re.sub(r'\s*\\?\s*', r'\\begin{pmatrix}', text)
    text = re.sub(r'\s*\\?\s*', r'\\end{pmatrix}', text)
    text = re.sub(r'R2←', r'R_2 \\leftarrow ', text)
    text = re.sub(r'R3←', r'R_3 \\leftarrow ', text)
    text = re.sub(r'R1−', r'R_1 - ', text)

    return text.strip()

def parse_existing_questions(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by "Problem X.Y."
    # We look for patterns like "Problem 1.1."
    problems = []

    # Regex to find problem starts
    # It seems the text has "Problem 1.1." then text.
    pattern = re.compile(r'(Problem\s+\d+\.\d+\.)')
    parts = pattern.split(content)

    current_section = "General"

    # Map from section number to section name based on the file content
    section_map = {
        '1': "Linear Algebra Fundamentals",
        '2': "Principal Component Analysis (PCA)",
        '3': "Optimization (Unconstrained)",
        '4': "Optimization (Constrained)",
        '5': "Support Vector Machines (SVM)",
        '6': "Minimization and Maximization using Matrices"
    }

    # Skip the intro part before the first problem

    for i in range(1, len(parts), 2):
        header = parts[i] # "Problem 1.1."
        body = parts[i+1] if i+1 < len(parts) else ""

        # Determine section from the problem number "1.1" -> section 1
        problem_num = header.split()[1] # "1.1."
        section_num = problem_num.split('.')[0]
        section_name = section_map.get(section_num, "General")

        # Split body into Question and Solution
        # Look for "Solution."
        sol_split = body.split('Solution.', 1)
        question_text = sol_split[0].strip()
        solution_text = sol_split[1].strip() if len(sol_split) > 1 else ""

        # Clean up text for LaTeX
        question_text = clean_text(question_text)
        solution_text = clean_text(solution_text)

        problems.append({
            'section': section_name,
            'header': header.strip(), # "Problem 1.1."
            'question': question_text,
            'solution': solution_text
        })

    return problems

NEW_QUESTIONS_L1_8 = [
    {
        'section': "Linear Algebra Fundamentals",
        'title': "Gram-Schmidt Orthogonalization",
        'question': r"Given two linearly independent vectors $v_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}$ and $v_2 = \begin{pmatrix} 1 \\ 2 \end{pmatrix}$ in $\mathbb{R}^2$, use the Gram-Schmidt process to find an orthonormal basis $\{u_1, u_2\}$ for the space spanned by these vectors.",
        'solution': r"""
\textbf{Step 1: Normalize the first vector $v_1$.}
The first basis vector $u_1$ is simply the unit vector in the direction of $v_1$.
\[ \|v_1\| = \sqrt{1^2 + 1^2} = \sqrt{2} \]
\[ u_1 = \frac{v_1}{\|v_1\|} = \frac{1}{\sqrt{2}} \begin{pmatrix} 1 \\ 1 \end{pmatrix} = \begin{pmatrix} 1/\sqrt{2} \\ 1/\sqrt{2} \end{pmatrix} \]

\textbf{Step 2: Find the orthogonal component of $v_2$.}
We define $w_2$ as the component of $v_2$ orthogonal to $u_1$.
\[ w_2 = v_2 - \text{proj}_{u_1}(v_2) = v_2 - \langle v_2, u_1 \rangle u_1 \]
Calculate the inner product $\langle v_2, u_1 \rangle$:
\[ \langle v_2, u_1 \rangle = (1)(1/\sqrt{2}) + (2)(1/\sqrt{2}) = \frac{3}{\sqrt{2}} \]
Now calculate the projection:
\[ \text{proj}_{u_1}(v_2) = \frac{3}{\sqrt{2}} u_1 = \frac{3}{\sqrt{2}} \begin{pmatrix} 1/\sqrt{2} \\ 1/\sqrt{2} \end{pmatrix} = \begin{pmatrix} 3/2 \\ 3/2 \end{pmatrix} \]
Subtract this from $v_2$:
\[ w_2 = \begin{pmatrix} 1 \\ 2 \end{pmatrix} - \begin{pmatrix} 1.5 \\ 1.5 \end{pmatrix} = \begin{pmatrix} -0.5 \\ 0.5 \end{pmatrix} \]

\textbf{Step 3: Normalize $w_2$ to get $u_2$.}
\[ \|w_2\| = \sqrt{(-0.5)^2 + (0.5)^2} = \sqrt{0.25 + 0.25} = \sqrt{0.5} = \frac{1}{\sqrt{2}} \]
\[ u_2 = \frac{w_2}{\|w_2\|} = \frac{1}{1/\sqrt{2}} \begin{pmatrix} -0.5 \\ 0.5 \end{pmatrix} = \sqrt{2} \begin{pmatrix} -0.5 \\ 0.5 \end{pmatrix} = \begin{pmatrix} -1/\sqrt{2} \\ 1/\sqrt{2} \end{pmatrix} \]

\textbf{Conclusion:}
The orthonormal basis is $\left\{ \begin{pmatrix} 1/\sqrt{2} \\ 1/\sqrt{2} \end{pmatrix}, \begin{pmatrix} -1/\sqrt{2} \\ 1/\sqrt{2} \end{pmatrix} \right\}$.
"""
    },
    {
        'section': "Linear Algebra Fundamentals",
        'title': "Cholesky Decomposition",
        'question': r"Find the Cholesky decomposition of the symmetric positive-definite matrix $A = \begin{pmatrix} 4 & 2 \\ 2 & 5 \end{pmatrix}$. That is, find a lower triangular matrix $L$ such that $A = LL^T$.",
        'solution': r"""
\textbf{Goal:} Find $L = \begin{pmatrix} l_{11} & 0 \\ l_{21} & l_{22} \end{pmatrix}$ such that $L L^T = A$.
\[ \begin{pmatrix} l_{11} & 0 \\ l_{21} & l_{22} \end{pmatrix} \begin{pmatrix} l_{11} & l_{21} \\ 0 & l_{22} \end{pmatrix} = \begin{pmatrix} l_{11}^2 & l_{11}l_{21} \\ l_{21}l_{11} & l_{21}^2 + l_{22}^2 \end{pmatrix} = \begin{pmatrix} 4 & 2 \\ 2 & 5 \end{pmatrix} \]

\textbf{Step 1: Solve for $l_{11}$.}
From element (1,1):
\[ l_{11}^2 = 4 \implies l_{11} = 2 \]

\textbf{Step 2: Solve for $l_{21}$.}
From element (2,1):
\[ l_{21} l_{11} = 2 \implies l_{21}(2) = 2 \implies l_{21} = 1 \]

\textbf{Step 3: Solve for $l_{22}$.}
From element (2,2):
\[ l_{21}^2 + l_{22}^2 = 5 \]
Substitute $l_{21} = 1$:
\[ 1^2 + l_{22}^2 = 5 \implies l_{22}^2 = 4 \implies l_{22} = 2 \]

\textbf{Conclusion:}
The lower triangular matrix is $L = \begin{pmatrix} 2 & 0 \\ 1 & 2 \end{pmatrix}$.
"""
    },
    {
        'section': "Linear Algebra Fundamentals",
        'title': "Cayley-Hamilton Theorem",
        'question': r"Verify the Cayley-Hamilton theorem for the matrix $A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$. The theorem states that a matrix satisfies its own characteristic equation.",
        'solution': r"""
\textbf{Step 1: Find the characteristic polynomial.}
The characteristic polynomial is $p(\lambda) = \det(A - \lambda I)$.
\[ \det \begin{pmatrix} 1-\lambda & 2 \\ 3 & 4-\lambda \end{pmatrix} = (1-\lambda)(4-\lambda) - (2)(3) \]
\[ = 4 - \lambda - 4\lambda + \lambda^2 - 6 = \lambda^2 - 5\lambda - 2 \]

\textbf{Step 2: Substitute $A$ into the polynomial.}
We need to check if $A^2 - 5A - 2I = 0$.

\textbf{Step 3: Calculate $A^2$.}
\[ A^2 = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} = \begin{pmatrix} 1(1)+2(3) & 1(2)+2(4) \\ 3(1)+4(3) & 3(2)+4(4) \end{pmatrix} = \begin{pmatrix} 7 & 10 \\ 15 & 22 \end{pmatrix} \]

\textbf{Step 4: Compute the expression.}
\[ A^2 - 5A - 2I = \begin{pmatrix} 7 & 10 \\ 15 & 22 \end{pmatrix} - 5\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} - 2\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} \]
\[ = \begin{pmatrix} 7 & 10 \\ 15 & 22 \end{pmatrix} - \begin{pmatrix} 5 & 10 \\ 15 & 20 \end{pmatrix} - \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} \]
\[ = \begin{pmatrix} 7-5-2 & 10-10-0 \\ 15-15-0 & 22-20-2 \end{pmatrix} = \begin{pmatrix} 0 & 0 \\ 0 & 0 \end{pmatrix} \]

\textbf{Conclusion:}
The result is the zero matrix, verifying the theorem.
"""
    },
    {
        'section': "Linear Algebra Fundamentals",
        'title': "Basis of Polynomial Space",
        'question': r"Determine whether the set of polynomials $S = \{1, x, x^2 - 1\}$ forms a basis for the vector space $P_2$ (polynomials of degree at most 2).",
        'solution': r"""
\textbf{Step 1: Check the dimension.}
The vector space $P_2$ has dimension 3 (standard basis is $\{1, x, x^2\}$). Since $S$ has 3 elements, we only need to verify they are linearly independent.

\textbf{Step 2: Check linear independence.}
Assume a linear combination equals the zero polynomial:
\[ c_1(1) + c_2(x) + c_3(x^2 - 1) = 0 \]
Rearrange terms by degree:
\[ c_3 x^2 + c_2 x + (c_1 - c_3) = 0 \]
For this to be the zero polynomial, each coefficient must be zero:
1. $c_3 = 0$
2. $c_2 = 0$
3. $c_1 - c_3 = 0$

From (1), $c_3 = 0$. From (3), $c_1 - 0 = 0 \implies c_1 = 0$.
Thus, $c_1 = c_2 = c_3 = 0$.

\textbf{Conclusion:}
The polynomials are linearly independent and span $P_2$. Therefore, $S$ is a basis.
"""
    },
    {
        'section': "Linear Algebra Fundamentals",
        'title': "Rank and System Consistency",
        'question': r"Consider the system of equations $Ax = b$ where $A$ is an $m \times n$ matrix. Explain the conditions on the rank of $A$ and the rank of the augmented matrix $[A|b]$ for the system to have: (a) No solution, (b) A unique solution, (c) Infinitely many solutions.",
        'solution': r"""
\textbf{(a) No Solution (Inconsistent System):}
The system has no solution if the rank of the augmented matrix is greater than the rank of the coefficient matrix.
\[ \text{rank}(A) < \text{rank}([A|b]) \]
This implies there is a pivot in the last column of the augmented matrix (an equation like $0 = b'$ where $b' \neq 0$).

\textbf{(b) Unique Solution:}
The system has a unique solution if it is consistent and the rank equals the number of variables $n$.
\[ \text{rank}(A) = \text{rank}([A|b]) = n \]
This implies there are no free variables.

\textbf{(c) Infinitely Many Solutions:}
The system has infinitely many solutions if it is consistent but the rank is less than the number of variables $n$.
\[ \text{rank}(A) = \text{rank}([A|b]) < n \]
This implies there is at least one free variable.
"""
    },
    {
        'section': "Minimization and Maximization using Matrices",
        'title': "Gradient of a Vector-Valued Function",
        'question': r"Let $f: \mathbb{R}^2 \to \mathbb{R}^2$ be defined by $f(x, y) = \begin{pmatrix} x^2 + y \\ xy \end{pmatrix}$. Compute the Jacobian matrix $J_f(x, y)$ at the point $(1, 2)$.",
        'solution': r"""
\textbf{Step 1: Definition of the Jacobian.}
The Jacobian matrix contains the partial derivatives of each output component with respect to each input component.
\[ J_f = \begin{pmatrix} \frac{\partial f_1}{\partial x} & \frac{\partial f_1}{\partial y} \\ \frac{\partial f_2}{\partial x} & \frac{\partial f_2}{\partial y} \end{pmatrix} \]
where $f_1 = x^2 + y$ and $f_2 = xy$.

\textbf{Step 2: Compute Partial Derivatives.}
\[ \frac{\partial f_1}{\partial x} = 2x, \quad \frac{\partial f_1}{\partial y} = 1 \]
\[ \frac{\partial f_2}{\partial x} = y, \quad \frac{\partial f_2}{\partial y} = x \]

\textbf{Step 3: Evaluate at $(1, 2)$.}
Substitute $x=1, y=2$:
\[ J_f(1, 2) = \begin{pmatrix} 2(1) & 1 \\ 2 & 1 \end{pmatrix} = \begin{pmatrix} 2 & 1 \\ 2 & 1 \end{pmatrix} \]
"""
    },
    {
        'section': "Minimization and Maximization using Matrices",
        'title': "Taylor Series Approximation",
        'question': r"Find the second-order Taylor series approximation of the function $f(x, y) = e^x \cos(y)$ around the point $(0, 0)$.",
        'solution': r"""
\textbf{Step 1: Compute Function Value and Gradients at $(0,0)$.}
$f(0,0) = e^0 \cos(0) = 1$.
First derivatives:
$f_x = e^x \cos(y) \implies f_x(0,0) = 1$.
$f_y = -e^x \sin(y) \implies f_y(0,0) = 0$.

\textbf{Step 2: Compute Second Derivatives at $(0,0)$.}
$f_{xx} = e^x \cos(y) \implies f_{xx}(0,0) = 1$.
$f_{yy} = -e^x \cos(y) \implies f_{yy}(0,0) = -1$.
$f_{xy} = -e^x \sin(y) \implies f_{xy}(0,0) = 0$.

\textbf{Step 3: Construct the Taylor Polynomial.}
\[ f(x,y) \approx f(0,0) + \begin{pmatrix} f_x & f_y \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} + \frac{1}{2} \begin{pmatrix} x & y \end{pmatrix} \begin{pmatrix} f_{xx} & f_{xy} \\ f_{xy} & f_{yy} \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} \]
\[ f(x,y) \approx 1 + (1)x + (0)y + \frac{1}{2} [ x^2(1) + 2xy(0) + y^2(-1) ] \]
\[ f(x,y) \approx 1 + x + \frac{1}{2}x^2 - \frac{1}{2}y^2 \]
"""
    },
    {
        'section': "Optimization (Unconstrained)",
        'title': "Automatic Differentiation",
        'question': r"Consider the function $f(x, y) = x^2y + y$. Perform a forward pass and a backward pass to compute the gradient at $(x=2, y=3)$ using a computational graph approach. Assume nodes $a = x^2$, $b = ay$, $f = b + y$.",
        'solution': r"""
\textbf{Step 1: Forward Pass (Compute Values).}
Given $x=2, y=3$.
1. $a = x^2 = 2^2 = 4$.
2. $b = a \cdot y = 4 \cdot 3 = 12$.
3. $f = b + y = 12 + 3 = 15$.

\textbf{Step 2: Backward Pass (Compute Gradients).}
We want $\frac{\partial f}{\partial x}$ and $\frac{\partial f}{\partial y}$. Let $\bar{v} = \frac{\partial f}{\partial v}$.
1. Start at output: $\bar{f} = 1$.
2. Node $f = b + y$:
   $\bar{b} = \bar{f} \cdot \frac{\partial f}{\partial b} = 1 \cdot 1 = 1$.
   $\bar{y}_{branch2} = \bar{f} \cdot \frac{\partial f}{\partial y} = 1 \cdot 1 = 1$.
3. Node $b = a \cdot y$:
   $\bar{a} = \bar{b} \cdot \frac{\partial b}{\partial a} = 1 \cdot y = 3$.
   $\bar{y}_{branch1} = \bar{b} \cdot \frac{\partial b}{\partial y} = 1 \cdot a = 4$.
4. Total gradient for $y$:
   $\bar{y} = \bar{y}_{branch1} + \bar{y}_{branch2} = 4 + 1 = 5$.
5. Node $a = x^2$:
   $\bar{x} = \bar{a} \cdot \frac{\partial a}{\partial x} = 3 \cdot (2x) = 3 \cdot 4 = 12$.

\textbf{Conclusion:}
The gradient is $\nabla f(2, 3) = (12, 5)$.
Check: $f_x = 2xy = 2(2)(3)=12$, $f_y = x^2+1 = 4+1=5$. Matches.
"""
    },
    {
        'section': "Linear Algebra Fundamentals",
        'title': "SVD Calculation",
        'question': r"Find the singular values of the matrix $A = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$.",
        'solution': r"""
\textbf{Step 1: Compute $A^T A$.}
\[ A^T A = \begin{pmatrix} 1 & 0 \\ 1 & 1 \end{pmatrix} \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 2 \end{pmatrix} \]

\textbf{Step 2: Find Eigenvalues of $A^T A$.}
Characteristic equation: $\det(A^T A - \lambda I) = 0$.
\[ (1-\lambda)(2-\lambda) - 1 = 0 \]
\[ 2 - 3\lambda + \lambda^2 - 1 = 0 \]
\[ \lambda^2 - 3\lambda + 1 = 0 \]
Roots: $\lambda = \frac{3 \pm \sqrt{9 - 4}}{2} = \frac{3 \pm \sqrt{5}}{2}$.
$\lambda_1 = \frac{3+\sqrt{5}}{2} \approx 2.618$, $\lambda_2 = \frac{3-\sqrt{5}}{2} \approx 0.382$.

\textbf{Step 3: Singular Values.}
Singular values are $\sigma_i = \sqrt{\lambda_i}$.
$\sigma_1 = \sqrt{\frac{3+\sqrt{5}}{2}} \approx 1.618$ (This is the Golden Ratio $\phi$).
$\sigma_2 = \sqrt{\frac{3-\sqrt{5}}{2}} \approx 0.618$ (This is $1/\phi$).

\textbf{Conclusion:}
The singular values are $\phi \approx 1.618$ and $1/\phi \approx 0.618$.
"""
    },
    {
        'section': "Linear Algebra Fundamentals",
        'title': "Subspaces",
        'question': r"Let $V = M_{n \times n}(\mathbb{R})$ be the vector space of all $n \times n$ matrices. Does the set of all symmetric matrices $S = \{A \in V \mid A = A^T\}$ form a subspace of $V$? Justify your answer.",
        'solution': r"""
\textbf{Step 1: Check for Zero Vector.}
The zero matrix $0$ satisfies $0^T = 0$, so $0 \in S$.

\textbf{Step 2: Check Closure under Addition.}
Let $A, B \in S$. Then $A^T = A$ and $B^T = B$.
Consider $A+B$:
$(A+B)^T = A^T + B^T = A + B$.
Thus, $A+B$ is symmetric, so $A+B \in S$.

\textbf{Step 3: Check Closure under Scalar Multiplication.}
Let $A \in S$ and $c \in \mathbb{R}$.
$(cA)^T = c(A^T) = cA$.
Thus, $cA$ is symmetric, so $cA \in S$.

\textbf{Conclusion:}
Since all conditions are satisfied, the set of symmetric matrices is a subspace of $M_{n \times n}$.
"""
    }
]

NEW_QUESTIONS_L9_16 = [
    {
        'section': "Optimization (Unconstrained)",
        'title': "Golden Section Search",
        'question': r"You are minimizing $f(x) = (x-1)^2$ on the interval $[0, 2]$. Perform one iteration of the Golden Section Search. Use the golden ratio $\phi = \frac{\sqrt{5}-1}{2} \approx 0.618$.",
        'solution': r"""
\textbf{Step 1: Define Initial Interval.}
$a = 0, b = 2$. Length $L = b - a = 2$.

\textbf{Step 2: Determine Test Points.}
$x_1 = b - \phi L = 2 - 0.618(2) = 2 - 1.236 = 0.764$.
$x_2 = a + \phi L = 0 + 0.618(2) = 1.236$.

\textbf{Step 3: Evaluate Function.}
$f(x_1) = f(0.764) = (0.764 - 1)^2 = (-0.236)^2 \approx 0.0557$.
$f(x_2) = f(1.236) = (1.236 - 1)^2 = (0.236)^2 \approx 0.0557$.

\textbf{Step 4: Update Interval.}
Since $f(x_1) \approx f(x_2)$ (due to symmetry around minimum $x=1$), we technically could pick either side or refine logic.
Standard algorithm: If $f(x_1) < f(x_2)$, pick $[a, x_2]$. If $f(x_1) > f(x_2)$, pick $[x_1, b]$.
Here they are equal. Let's strictly follow $f(x_1) \le f(x_2) \implies$ eliminate right side $(x_2, b]$.
New interval is $[a, x_2] = [0, 1.236]$.
(Alternatively, since min is at 1, both points are equidistant, reducing to $[0.764, 2]$ is also valid in some implementations depending on strict inequality. The key is shrinking the interval).

\textbf{Conclusion:}
After one iteration, the interval shrinks to $[0, 1.236]$ (or $[0.764, 2]$).
"""
    },
    {
        'section': "Optimization (Unconstrained)",
        'title': "Feature Scaling and Gradient Descent",
        'question': r"Consider a loss function $J(w_1, w_2) = 50w_1^2 + w_2^2$. (a) Describe the shape of the contour plots. (b) Explain why Gradient Descent might oscillate or converge slowly on this function without feature scaling.",
        'solution': r"""
\textbf{(a) Contour Shape:}
The level sets $50w_1^2 + w_2^2 = k$ describe ellipses.
Since the coefficient of $w_1^2$ is 50 times larger than that of $w_2^2$, the ellipses are extremely narrow and elongated along the $w_2$ axis (the valley is steep in $w_1$ direction and flat in $w_2$ direction).

\textbf{(b) Convergence Issue:}
The gradient is $\nabla J = (100w_1, 2w_2)$.
A step in the $w_1$ direction is 50 times larger than in the $w_2$ direction for the same parameter value.
- To avoid overshooting in the steep $w_1$ direction, the learning rate $\alpha$ must be very small (proportional to $1/100$).
- However, with such a small $\alpha$, the progress along the flat $w_2$ direction (where gradient is small) will be excruciatingly slow.
- If $\alpha$ is increased to speed up $w_2$, it will cause instability (oscillation/divergence) in $w_1$.
This "differential curvature" makes standard Gradient Descent inefficient. Feature scaling (normalizing) converts the contours to circles, resolving this.
"""
    },
    {
        'section': "Optimization (Unconstrained)",
        'title': "Momentum Update Calculation",
        'question': r"You are using Gradient Descent with Momentum. The update rules are: $v_t = \beta v_{t-1} + (1-\beta)\nabla J(\theta_{t-1})$ and $\theta_t = \theta_{t-1} - \alpha v_t$. (Note: Standard formulation often omits $(1-\beta)$ scaling, but we use this for exponential moving average interpretation). Let $\beta = 0.9, \alpha = 0.1$. Initial $v_0 = 0$. Gradients observed are $g_1 = 10, g_2 = 10$. Calculate the parameter updates $\Delta \theta_1$ and $\Delta \theta_2$.",
        'solution': r"""
\textbf{Step 1: Iteration 1.}
Gradient $g_1 = 10$.
$v_1 = 0.9(0) + (1-0.9)(10) = 0 + 1 = 1$.
Update $\Delta \theta_1 = -\alpha v_1 = -0.1(1) = -0.1$.

\textbf{Step 2: Iteration 2.}
Gradient $g_2 = 10$.
$v_2 = 0.9(v_1) + 0.1(g_2) = 0.9(1) + 0.1(10) = 0.9 + 1 = 1.9$.
Update $\Delta \theta_2 = -\alpha v_2 = -0.1(1.9) = -0.19$.

\textbf{Conclusion:}
The updates are -0.1 and -0.19. The momentum causes the step size to increase even though the gradient stayed constant, accelerating convergence.
"""
    },
    {
        'section': "Principal Component Analysis (PCA)",
        'title': "Explained Variance Ratio",
        'question': r"A dataset has covariance eigenvalues $\lambda = \{12, 6, 2\}$. Calculate the proportion of variance explained by the first principal component and the cumulative variance of the first two.",
        'solution': r"""
\textbf{Step 1: Total Variance.}
$\lambda_{total} = 12 + 6 + 2 = 20$.

\textbf{Step 2: First Component Variance.}
Proportion $P_1 = \frac{12}{20} = 0.6$ or $60\%$.

\textbf{Step 3: Cumulative Variance (First Two).}
Sum $\lambda_1 + \lambda_2 = 12 + 6 = 18$.
Cumulative Proportion $P_{1+2} = \frac{18}{20} = 0.9$ or $90\%$.
"""
    },
    {
        'section': "Principal Component Analysis (PCA)",
        'title': "Power Iteration",
        'question': r"Perform one iteration of the Power Method to approximate the dominant eigenvector of $A = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$. Start with $v_0 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}$.",
        'solution': r"""
\textbf{Step 1: Multiply by Matrix.}
$w_1 = A v_0 = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix} \begin{pmatrix} 1 \\ 1 \end{pmatrix} = \begin{pmatrix} 2(1)+1(1) \\ 1(1)+3(1) \end{pmatrix} = \begin{pmatrix} 3 \\ 4 \end{pmatrix}$.

\textbf{Step 2: Normalize (using max norm or Euclidean).}
Using max norm (making largest component 1):
$v_1 = \frac{w_1}{\max(w_1)} = \frac{1}{4} \begin{pmatrix} 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 0.75 \\ 1.0 \end{pmatrix}$.
(Using Euclidean norm is also valid: $\|w_1\| = 5$, so $v_1 = (0.6, 0.8)^T$).

\textbf{Conclusion:}
The approximate eigenvector after one step is $\begin{pmatrix} 0.75 \\ 1.0 \end{pmatrix}$.
"""
    },
    {
        'section': "Optimization (Constrained)",
        'title': "Slater's Condition",
        'question': r"Consider the optimization problem: $\min x$ subject to $x^2 \le 0$. Does Slater's condition hold? What does this imply about Strong Duality?",
        'solution': r"""
\textbf{Step 1: Check Feasible Set.}
The constraint $x^2 \le 0$ implies $x = 0$ (since $x^2$ is non-negative).
The only feasible point is $x=0$.

\textbf{Step 2: Slater's Condition Definition.}
Slater's condition requires the existence of a strictly feasible point $x$ such that $g(x) < 0$ for all inequality constraints.
Here, we need $x^2 < 0$. This is impossible for real numbers.

\textbf{Conclusion:}
Slater's condition does \textbf{not} hold.
Implication: Strong duality is not guaranteed by Slater's condition (though it might still hold in specific cases, we cannot assume it).
"""
    },
    {
        'section': "Support Vector Machines (SVM)",
        'title': "Soft Margin Slack Calculation",
        'question': r"In a soft-margin SVM, a training point $(x_i, y_i)$ with $y_i = 1$ has a decision function value $w^T x_i + b = 0.4$. (a) Is this point classified correctly? (b) Does it satisfy the margin constraint? (c) Calculate the slack variable $\xi_i$.",
        'solution': r"""
\textbf{(a) Classification Check:}
Prediction is $\text{sign}(0.4) = +1$. True label is $+1$.
Yes, it is classified correctly.

\textbf{(b) Margin Constraint Check:}
The constraint requires $y_i(w^T x_i + b) \ge 1 - \xi_i$ with $\xi_i \ge 0$.
Here, functional margin is $1(0.4) = 0.4$.
Since $0.4 < 1$, it violates the strict margin constraint (it is inside the margin).

\textbf{(c) Slack Calculation:}
We need $0.4 \ge 1 - \xi_i \implies \xi_i \ge 1 - 0.4 = 0.6$.
The minimal slack required is $\xi_i = 0.6$.
"""
    },
    {
        'section': "Support Vector Machines (SVM)",
        'title': "Polynomial Kernel Matrix",
        'question': r"Given two data points $x_1 = (1, 2)$ and $x_2 = (2, 1)$. Calculate the kernel matrix entry $K_{12}$ using the polynomial kernel $K(x, y) = (1 + x^T y)^2$.",
        'solution': r"""
\textbf{Step 1: Compute Dot Product.}
$x_1^T x_2 = (1)(2) + (2)(1) = 2 + 2 = 4$.

\textbf{Step 2: Apply Kernel Function.}
$K(x_1, x_2) = (1 + 4)^2 = 5^2 = 25$.

\textbf{Conclusion:}
The kernel value is 25.
"""
    },
    {
        'section': "Support Vector Machines (SVM)",
        'title': "XOR Problem and Linear SVM",
        'question': r"The XOR dataset consists of points $(0,0), (1,1)$ labeled $-1$ and $(0,1), (1,0)$ labeled $+1$. Prove geometrically or algebraically that this dataset is not linearly separable.",
        'solution': r"""
\textbf{Proof by Contradiction:}
Assume there exists a linear separator $w_1 x_1 + w_2 x_2 + b = 0$ that separates the classes.
For class $+1$:
$f(0,1) > 0 \implies w_2 + b > 0$
$f(1,0) > 0 \implies w_1 + b > 0$
Summing these: $w_1 + w_2 + 2b > 0$.

For class $-1$:
$f(0,0) < 0 \implies b < 0$
$f(1,1) < 0 \implies w_1 + w_2 + b < 0$
Summing these: $w_1 + w_2 + 2b < 0$.

\textbf{Conclusion:}
We have reached a contradiction ($val > 0$ and $val < 0$). Therefore, no such linear separator exists.
"""
    },
    {
        'section': "Optimization (Constrained)",
        'title': "Dual of Linear Program",
        'question': r"Find the dual of the following Linear Program (LP): $\min c^T x$ subject to $Ax \ge b, x \ge 0$.",
        'solution': r"""
\textbf{Step 1: Lagrangian Formulation.}
Constraints can be written as $b - Ax \le 0$ and $-x \le 0$.
$L(x, \lambda, \nu) = c^T x + \lambda^T (b - Ax) + \nu^T (-x)$ where $\lambda \ge 0, \nu \ge 0$.
$L(x, \lambda, \nu) = (c^T - \lambda^T A - \nu^T)x + \lambda^T b$.

\textbf{Step 2: Minimize Lagrangian w.r.t x.}
For the minimum to be bounded (not $-\infty$), the coefficient of $x$ must be zero:
$c - A^T \lambda - \nu = 0 \implies A^T \lambda + \nu = c$.
Since $\nu \ge 0$, this implies $A^T \lambda \le c$.

\textbf{Step 3: Formulate Dual.}
Maximize the remaining term $\lambda^T b$ (or $b^T \lambda$) subject to constraints.
Objective: $\max b^T \lambda$.
Constraints: $A^T \lambda \le c$ and $\lambda \ge 0$.
"""
    },
    {
        'section': "Principal Component Analysis (PCA)",
        'title': "High Dimensional PCA",
        'question': r"You have a dataset with $N=50$ samples and $D=10,000$ features. Calculating the full $10,000 \times 10,000$ covariance matrix is expensive. Describe the efficient method to find the eigenvectors of the covariance matrix $S = \frac{1}{N} X X^T$.",
        'solution': r"""
\textbf{Method:}
1. Instead of diagonalizing $S = \frac{1}{N} X X^T$ ($D \times D$), compute the Gram matrix $G = X^T X$ ($N \times N$, which is $50 \times 50$).
2. Solve the eigenvalue problem for $G$: $X^T X v_i = \mu_i v_i$.
3. The eigenvectors $u_i$ of $S$ can be recovered from $v_i$.
   Multiply by $X$: $X (X^T X v_i) = \mu_i X v_i$.
   $(X X^T) (X v_i) = \mu_i (X v_i)$.
   So $X v_i$ is an eigenvector of $X X^T$.
4. Normalize: $u_i = \frac{1}{\sqrt{\mu_i}} X v_i$.

\textbf{Efficiency:}
We operate on a $50 \times 50$ matrix instead of $10,000 \times 10,000$, which is drastically faster.
"""
    },
    {
        'section': "Optimization (Constrained)",
        'title': "Equality Constrained Optimization",
        'question': r"Minimize $f(x, y) = x + y$ subject to $x^2 + y^2 = 1$ using Lagrange Multipliers.",
        'solution': r"""
\textbf{Step 1: Lagrangian.}
$L(x, y, \lambda) = x + y + \lambda(x^2 + y^2 - 1)$.

\textbf{Step 2: Gradients.}
$1 + 2\lambda x = 0 \implies x = -1/(2\lambda)$.
$1 + 2\lambda y = 0 \implies y = -1/(2\lambda)$.
$x^2 + y^2 = 1$.

\textbf{Step 3: Solve.}
$x = y$.
$x^2 + x^2 = 1 \implies 2x^2 = 1 \implies x^2 = 1/2 \implies x = \pm 1/\sqrt{2}$.
Case 1: $x = y = -1/\sqrt{2}$. $\lambda = -1/(2x) = 1/\sqrt{2} > 0$. $f = -\sqrt{2}$.
Case 2: $x = y = 1/\sqrt{2}$. $\lambda = -1/(2x) = -1/\sqrt{2}$. $f = \sqrt{2}$.

\textbf{Conclusion:}
Minimum value is $-\sqrt{2}$ at $(-1/\sqrt{2}, -1/\sqrt{2})$.
"""
    },
    {
        'section': "Support Vector Machines (SVM)",
        'title': "RBF Kernel Behavior",
        'question': r"Consider the RBF kernel $K(x, x') = \exp(-\gamma \|x - x'\|^2)$. What happens to the decision boundary as $\gamma \to \infty$? Why?",
        'solution': r"""
\textbf{Explanation:}
As $\gamma \to \infty$, the kernel value drops to zero very sharply as soon as $x \neq x'$.
$K(x, x') \approx 1$ if $x \approx x'$, and $0$ otherwise.
The model effectively memorizes the training data. The decision boundary forms tiny islands (bubbles) around each positive training example.
This leads to severe **overfitting** (high variance). The model will have 100\% training accuracy but poor generalization.
"""
    },
    {
        'section': "Optimization (Unconstrained)",
        'title': "Learning Rate Impact",
        'question': r"Sketch conceptually how the training loss curve (Loss vs Iterations) would look if the learning rate $\alpha$ is (a) too low, (b) optimal, (c) way too high.",
        'solution': r"""
\textbf{(a) Too Low:}
The curve decreases monotonically but very slowly. It looks like a straight line with a small negative slope that takes forever to flatten out.

\textbf{(b) Optimal:}
The curve decreases rapidly at first and then smoothly plateaus out to the minimum value.

\textbf{(c) Way Too High:}
The curve oscillates wildly or even increases (diverges). You might see the loss jumping up and down or shooting up to infinity.
"""
    },
    {
        'section': "Optimization (Constrained)",
        'title': "KKT Conditions List",
        'question': r"List the four Karush-Kuhn-Tucker (KKT) conditions for the problem: $\min f(x)$ s.t. $g_i(x) \le 0$.",
        'solution': r"""
\textbf{1. Stationarity:}
$\nabla f(x^*) + \sum \lambda_i^* \nabla g_i(x^*) = 0$. (Gradient of objective is cancelled by gradients of constraints).

\textbf{2. Primal Feasibility:}
$g_i(x^*) \le 0$ for all $i$. (The point must satisfy the constraints).

\textbf{3. Dual Feasibility:}
$\lambda_i^* \ge 0$. (Lagrange multipliers must be non-negative).

\textbf{4. Complementary Slackness:}
$\lambda_i^* g_i(x^*) = 0$. (Either the constraint is active ($g_i=0$) or the multiplier is zero ($\lambda_i=0$)).
"""
    }
]

def generate_latex(existing_problems):
    output = PREAMBLE

    sections = [
        "Linear Algebra Fundamentals",
        "Principal Component Analysis (PCA)",
        "Optimization (Unconstrained)",
        "Optimization (Constrained)",
        "Support Vector Machines (SVM)",
        "Minimization and Maximization using Matrices"
    ]

    # Merge existing and new problems
    all_problems = []

    # Add existing
    for p in existing_problems:
        p['source'] = 'existing'
        all_problems.append(p)

    # Add new
    for p in NEW_QUESTIONS_L1_8 + NEW_QUESTIONS_L9_16:
        p['source'] = 'new'
        # Assign a generic header for new problems temporarily
        p['header'] = "Problem New"
        all_problems.append(p)

    # Sort/Group by section
    problems_by_section = {s: [] for s in sections}
    for p in all_problems:
        s = p['section']
        if s in problems_by_section:
            problems_by_section[s].append(p)
        else:
            # Fallback for mismatches
            problems_by_section["Linear Algebra Fundamentals"].append(p)

    for section in sections:
        output += f"\\section{{{section}}}\n\n"

        # We need to re-number problems to be consistent?
        # The prompt uses tcolorbox auto counter "question", so we don't need manual numbering in the title.
        # But the existing problems have "Problem 1.1" text.
        # I will use the LaTeX environment `question` which I defined.
        # I will put the title inside the environment argument.

        for i, p in enumerate(problems_by_section[section]):
            # Use a descriptive title if available (from new questions), else use "Problem X.Y" from existing
            if p['source'] == 'new':
                title = p['title']
                q_text = p['question']
                s_text = p['solution']
            else:
                title = "Practice Problem" # Or keep original numbering text if preferred?
                # The existing 'header' is "Problem 1.1."
                title = p['header'].strip().rstrip('.') # "Problem 1.1"
                q_text = p['question']
                s_text = p['solution']

            output += f"\\begin{{question}}[{title}]\n"
            output += q_text + "\n"
            output += "\\end{question}\n\n"

            output += "\\begin{solution}\n"
            output += s_text + "\n"
            output += "\\end{solution}\n\n"

    output += "\\end{document}"
    return output

def main():
    existing_problems = parse_existing_questions('existing_questions.txt')
    latex_content = generate_latex(existing_problems)

    with open('MFML_Practice_Questions_Updated.tex', 'w', encoding='utf-8') as f:
        f.write(latex_content)

    print("Successfully generated MFML_Practice_Questions_Updated.tex")

if __name__ == "__main__":
    main()
