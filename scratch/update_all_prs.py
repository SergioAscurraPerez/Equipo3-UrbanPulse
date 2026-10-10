import subprocess
import os
import glob

repo_dir = r"C:\TAYProy\Equipo3-UrbanPulse"
workflow_dir = os.path.join(repo_dir, ".github", "workflows")

branches = [
    "dependabot/npm_and_yarn/src/frontend/frontend-minor-patch-38a44a2196",
    "dependabot/npm_and_yarn/mf-chatbot/mf-chatbot-minor-patch-85f0e6eacf",
    "dependabot/npm_and_yarn/mf-dashboard/mf-dashboard-minor-patch-85f0e6eacf",
    "dependabot/npm_and_yarn/mf-mapa-urbano/mf-mapa-urbano-minor-patch-85f0e6eacf",
    "feat/ht-41-t03-jira-automation",
    "dependabot/npm_and_yarn/src/frontend/typescript-7.0.2",
    "dependabot/npm_and_yarn/src/frontend/babel/preset-env-8.0.6",
    "dependabot/npm_and_yarn/src/frontend/babel/preset-react-8.0.1",
    "dependabot/npm_and_yarn/src/frontend/react-router-dom-7.18.4",
    "dependabot/npm_and_yarn/ia-ops/tests/types/node-26.6.3",
]

replacements = {
    "actions/checkout@v7": "actions/checkout@v4",
    "actions/setup-node@v7": "actions/setup-node@v4",
    "actions/setup-python@v7": "actions/setup-python@v5",
    "actions/upload-artifact@v7": "actions/upload-artifact@v4",
}

def run_cmd(cmd, cwd=repo_dir):
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    print(f"[{cmd}] Exit: {res.returncode}")
    if res.stdout:
        print("  STDOUT:", res.stdout.strip())
    if res.stderr:
        print("  STDERR:", res.stderr.strip())
    return res.returncode

run_cmd("git fetch --all")

for branch in branches:
    print(f"\n==========================================")
    print(f"Processing branch: {branch}")
    print(f"==========================================")
    
    # Checkout remote branch
    run_cmd(f"git checkout -B work-branch upstream/{branch}")
    
    # Merge upstream/main into branch
    run_cmd('git merge upstream/main --no-edit -m "chore(ci): merge upstream/main and sync workflow fixes"')
    
    # Fix workflow files if any @v7 remains
    modified = False
    for filepath in glob.glob(os.path.join(workflow_dir, "*.yml")):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        file_mod = False
        for old_val, new_val in replacements.items():
            if old_val in content:
                content = content.replace(old_val, new_val)
                file_mod = True
                modified = True
        
        if file_mod:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
    
    if modified:
        run_cmd('git commit -am "fix(ci): restore valid GitHub Actions versions (@v4/@v5)"')
    
    # Create empty trigger commit to guarantee Vercel & GitHub Actions trigger
    run_cmd('git commit --allow-empty -m "chore(ci): trigger Vercel build and GitHub Actions validation re-run"')
    
    # Push to upstream
    run_cmd(f"git push upstream HEAD:{branch}")

print("\nFinished updating all PR branches!")
