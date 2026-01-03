import type {Client} from 'ssh2';
import {readRemoteFile, writeRemoteFile} from './ssh-file-operations';

export interface PlanItem {
  text: string;
  checked: boolean;
}

export interface PlanSection {
  title: string;
  items: PlanItem[];
}

export interface ParsedPlan {
  sections: PlanSection[];
}

export interface PlanFileResult {
  success: boolean;
  content?: string;
  error?: string;
}

export async function readPlanFile(client: Client): Promise<PlanFileResult> {
  const planPath = 'remote-dev-workspace/plan.md';
  const result = await readRemoteFile(client, planPath);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    content: result.content,
  };
}

export function parsePlan(content: string): ParsedPlan {
  const lines = content.split('\n');
  const sections: PlanSection[] = [];
  let currentSection: PlanSection | null = null;

  for (const line of lines) {
    // Match section headers (## Title)
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: sectionMatch[1],
        items: [],
      };
      continue;
    }

    // Match checkbox items (- [x] or - [ ])
    const itemMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (itemMatch && currentSection) {
      const checked = itemMatch[1] === 'x';
      const text = itemMatch[2];
      currentSection.items.push({text, checked});
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return {sections};
}

export function updateCheckStatus(
  content: string,
  sectionTitle: string,
  itemIndex: number,
  checked: boolean,
): string {
  const lines = content.split('\n');
  let currentSection: string | null = null;
  let currentItemIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match section headers
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      currentItemIndex = 0;
      continue;
    }

    // Match checkbox items
    const itemMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (itemMatch && currentSection === sectionTitle) {
      if (currentItemIndex === itemIndex) {
        const checkMark = checked ? 'x' : ' ';
        lines[i] = `- [${checkMark}] ${itemMatch[2]}`;
        break;
      }
      currentItemIndex++;
    }
  }

  return lines.join('\n');
}

export function addPlanItem(
  content: string,
  sectionTitle: string,
  itemText: string,
): string {
  const lines = content.split('\n');
  let currentSection: string | null = null;
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match section headers
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      if (currentSection === sectionTitle && insertIndex === -1) {
        // We just finished the target section, insert before this line
        insertIndex = i;
        break;
      }
      currentSection = sectionMatch[1];
      continue;
    }

    // If we're at the end of file and in the target section
    if (i === lines.length - 1 && currentSection === sectionTitle) {
      insertIndex = lines.length;
    }
  }

  if (insertIndex !== -1) {
    const newItem = `- [ ] ${itemText}`;
    lines.splice(insertIndex, 0, newItem);
  }

  return lines.join('\n');
}

export function deletePlanItem(
  content: string,
  sectionTitle: string,
  itemIndex: number,
): string {
  const lines = content.split('\n');
  let currentSection: string | null = null;
  let currentItemIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match section headers
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      currentItemIndex = 0;
      continue;
    }

    // Match checkbox items
    const itemMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (itemMatch && currentSection === sectionTitle) {
      if (currentItemIndex === itemIndex) {
        // Remove this line
        lines.splice(i, 1);
        break;
      }
      currentItemIndex++;
    }
  }

  return lines.join('\n');
}

export async function writePlanFile(
  client: Client,
  content: string,
): Promise<PlanFileResult> {
  const planPath = 'remote-dev-workspace/plan.md';
  const result = await writeRemoteFile(client, planPath, content);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
  };
}
