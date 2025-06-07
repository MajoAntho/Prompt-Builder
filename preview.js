
export function generateTextFormat(orderedFields, promptData) {
    let text = '';
    const fieldLabels = {
        role: 'RÔLE',
        context: 'CONTEXTE',
        task: 'TÂCHE',
        instructions: 'INSTRUCTIONS',
        output: 'FORMAT DE SORTIE',
        variables: 'VARIABLES'
    };

    orderedFields.forEach(field => {
        if (promptData[field]) {
            if (field === 'variables' && promptData.variables.length > 0) {
                text += `${fieldLabels[field]}:\n`;
                promptData.variables.forEach(v => {
                    if (v.name) {
                        text += `- ${v.name}: ${v.value}\n`;
                    }
                });
                text += '\n';
            } else if (field !== 'variables') {
                text += `${fieldLabels[field]}:\n${promptData[field]}\n\n`;
            }
        }
    });

    return text.trim();
}

export function generateMarkdownFormat(orderedFields, promptData) {
    let md = '# Prompt Structuré\n\n';
    const fieldLabels = {
        role: 'Rôle',
        context: 'Contexte',
        task: 'Tâche',
        instructions: 'Instructions',
        output: 'Format de sortie',
        variables: 'Variables'
    };

    orderedFields.forEach(field => {
        if (promptData[field]) {
            if (field === 'variables' && promptData.variables.length > 0) {
                md += `## ${fieldLabels[field]}\n\n`;
                promptData.variables.forEach(v => {
                    if (v.name) {
                        md += `- **${v.name}**: ${v.value}\n`;
                    }
                });
                md += '\n';
            } else if (field !== 'variables') {
                md += `## ${fieldLabels[field]}\n\n${promptData[field]}\n\n`;
            }
        }
    });

    return md.trim();
}

export function generateJSONFormat(orderedFields, promptData) {
    const data = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        prompt: {}
    };

    orderedFields.forEach(field => {
        if (promptData[field]) {
            if (field === 'instructions') {
                data.prompt[field] = promptData[field].split('\n').filter(i => i.trim());
            } else if (field === 'variables' && promptData.variables.length > 0) {
                data.prompt.variables = {};
                promptData.variables.forEach(v => {
                    if (v.name) {
                        data.prompt.variables[v.name] = v.value;
                    }
                });
            } else if (field !== 'variables') {
                data.prompt[field] = promptData[field];
            }
        }
    });

    return JSON.stringify(data, null, 2);
}

export function generateXMLFormat(orderedFields, promptData) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<prompt version="2.0">\n';
    xml += `  <metadata>\n`;
    xml += `    <created>${new Date().toISOString()}</created>\n`;
    xml += `    <generator>Prompt Builder Pro 2.0</generator>\n`;
    xml += `  </metadata>\n`;

    orderedFields.forEach(field => {
        if (promptData[field]) {
            if (field === 'instructions') {
                xml += `  <instructions>\n`;
                promptData[field].split('\n').filter(i => i.trim()).forEach(inst => {
                    xml += `    <instruction>${escapeXML(inst.trim())}</instruction>\n`;
                });
                xml += `  </instructions>\n`;
            } else if (field === 'variables' && promptData.variables.length > 0) {
                xml += `  <variables>\n`;
                promptData.variables.forEach(v => {
                    if (v.name) {
                        xml += `    <variable name="${escapeXML(v.name)}">${escapeXML(v.value)}</variable>\n`;
                    }
                });
                xml += `  </variables>\n`;
            } else if (field !== 'variables') {
                xml += `  <${field}>${escapeXML(promptData[field])}</${field}>\n`;
            }
        }
    });

    xml += '</prompt>';
    return xml;
}

export function escapeXML(str) {
    if (!str) return '';
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    };
    return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
}
