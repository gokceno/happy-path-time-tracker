import * as fs from 'fs';

const Document = () => {
  let _logoFile;
  let _currency = 'TRL';
  let _totalHours = 0;
  let _totalBillableAmount = 0;
  let _breakdownByTaskItems = [];
  let _breakdownByTeamMembers = [];
  let _workItems = [];
  let _header = [];
  let _notes = [];
  const _tableHeaderColProps = { 
    fillColor: '#eaf2f5',
    border: [false, false, false, true],
    margin: [0, 5, 0, 5]
  };
  const _tableBodyColProps1 = {
    border: [false, false, false, true],
    margin: [0, 5, 0, 5],
  };
  const _tableBodyColProps2 = {
    ... _tableBodyColProps1,
    fontSize: 10
  };
  const _defaultTableLayout =  {
    defaultBorder: false,
    hLineWidth: function(i, node) {
      return 1;
    },
    vLineWidth: function(i, node) {
      return 1;
    },
    hLineColor: function(i, node) {
      if (i === 1 || i === 0) {
        return '#bfdde8';
      }
      return '#eaeaea';
    },
    vLineColor: function(i, node) {
      return '#eaeaea';
    },
    hLineStyle: function(i, node) {
      return null;
    },
    paddingLeft: function(i, node) {
      return 10;
    },
    paddingRight: function(i, node) {
      return 10;
    },
    paddingTop: function(i, node) {
      return 2;
    },
    paddingBottom: function(i, node) {
      return 2;
    },
    fillColor: function(rowIndex, node, columnIndex) {
      return '#fff';
    },
  };
  const _footerTableLayout = {
    defaultBorder: false,
    hLineWidth: function(i, node) {
      return 1;
    },
    vLineWidth: function(i, node) {
      return 1;
    },
    hLineColor: function(i, node) {
      return '#eaeaea';
    },
    vLineColor: function(i, node) {
      return '#eaeaea';
    },
    hLineStyle: function(i, node) {
      return null;
    },
    paddingLeft: function(i, node) {
      return 10;
    },
    paddingRight: function(i, node) {
      return 10;
    },
    paddingTop: function(i, node) {
      return 3;
    },
    paddingBottom: function(i, node) {
      return 3;
    },
    fillColor: function(rowIndex, node, columnIndex) {
      return '#fff';
    },
  };
  const _getLogo = () => {
    if(_logoFile != undefined) {
      return {
        image: 'data:image/png;base64,' + _logoFile,
        width: 75,
      }
    }
  }
  const _getTitle = (text) => {
   return {
      text,
      color: '#333333',
      width: '*',
      fontSize: 20,
      bold: true,
      alignment: 'right',
      margin: [0, 0, 0, 15],
    }
  }
  const _getSubTitle = (text) => {
   return {
      text,
      color: '#333333',
      width: '*',
      fontSize: 18,
      bold: true,
      alignment: 'left',
      margin: [0, 0, 0, 15],
    }
  }
  const _getBreakdownByTaskItems = () => {
    const header = [
      [
        {
          text: 'Task',
          ... _tableHeaderColProps
        },
        {
          text: 'Hours',
          alignment: 'right',
          ... _tableHeaderColProps
        },
        {
          text: 'Total Billable',
          alignment: 'right',
          ... _tableHeaderColProps
        },
      ]
    ];
    const body = _breakdownByTaskItems.map(item => {
      return [
        {
          text: item.taskTitle,
          ... _tableBodyColProps1
        },
        {
          border: [false, false, false, true],
          text: `${item.totalHours}`, // TODO: Must be formatted as HH:mm
          fillColor: '#f5f5f5',
          alignment: 'right',
          margin: [0, 5, 0, 5],
        },
        {
          border: [false, false, false, true],
          text: `${_currency} ${item.totalBillableAmount.toFixed(2)}`,
          fillColor: '#f5f5f5',
          alignment: 'right',
          margin: [0, 5, 0, 5],
        }
      ];
    });
    return [...header, ...body];
  }
  const _getBreakdownByTeamMembers = () => {
    const header = [
      [
        {
          text: 'Member',
          ... _tableHeaderColProps
        },
        {
          text: 'Hours',
          alignment: 'right',
          ... _tableHeaderColProps
        },
        {
          text: 'Total Billable',
          alignment: 'right',
          ... _tableHeaderColProps
        },
      ]
    ];
    const body = _breakdownByTeamMembers.map(item => {
      return [
        {
          text: item.nameSurname,
          ... _tableBodyColProps1
        },
        {
          border: [false, false, false, true],
          text: `${item.totalHours}`, // TODO: Must be formatted as HH:mm
          fillColor: '#f5f5f5',
          alignment: 'right',
          margin: [0, 5, 0, 5],
        },
        {
          border: [false, false, false, true],
          text: `${_currency} ${item.totalBillableAmount.toFixed(2)}`,
          fillColor: '#f5f5f5',
          alignment: 'right',
          margin: [0, 5, 0, 5],
        }
      ];
    });
    return [...header, ...body];
  }
  const _getWorkItems = () => {
    const header = [
      [
        {
          text: 'Date',
          ... _tableHeaderColProps
        },
        {
          text: 'Member',
          ... _tableHeaderColProps
        },
        {
          text: 'Task',
          ... _tableHeaderColProps
        },        
        {
          text: 'Hours',
          alignment: 'right',
          ... _tableHeaderColProps
        },
        {
          text: 'Billable',
          alignment: 'right',
          ... _tableHeaderColProps
        },
      ]
    ];
    const body = _workItems.map(item => {
      return [
        {
          text: item.date,
          ... _tableBodyColProps2
        },
        {
          text: item.nameSurname,
          ... _tableBodyColProps2
        },
        {
          text: item.task,
          ... _tableBodyColProps2
        },
        {
          text: `${item.hours}`, // TODO: Must be formatted as HH:mm
          fillColor: '#f5f5f5',
          alignment: 'right',
          ... _tableBodyColProps2
        },
        {
          text: `${_currency} ${item.billableAmount.toFixed(2)}`,
          fillColor: '#f5f5f5',
          alignment: 'right',
          ... _tableBodyColProps2
        }
      ];
    });
    return [...header, ...body];
  }
  const _getHeader = () => {
    return { stack: [
        ... _header.map(header => {
          return { 
            columns: [
              {
                text: header.label.toUpperCase(),
                color: '#aaaaab',
                bold: true,
                fontSize: 10,
                alignment: 'right',
                width: '*',
              },
              {
                text: header.value,
                bold: true,
                fontSize: 12,
                color: '#aaaaab',
                color: '',
                alignment: 'right',
                width: 90,
              },
            ]
          };
        })
      ]
    }
  }
  const _getTotalLine = (title, price) => {
    return [
      {
        text: title,
        border: [false, false, false, true],
        alignment: 'right',
        margin: [0, 5, 0, 5],
      },
      {
        border: [false, false, false, true],
        text: price,
        alignment: 'right',
        fillColor: '#f5f5f5',
        margin: [0, 5, 0, 5],
      },
    ];
  }
  const get = () => {
    const DocumentDefinition = {
      content: [
        {
          columns: [
            _getLogo(),
            [
              _getTitle('Monthly Report'),
              _getHeader(),
            ],
          ],
        },
        '\n\n',
        '\n\n',
        '\n\n',
        _getSubTitle('Breakdown by Tasks'),
        {
          layout: _defaultTableLayout,
          table: {
            headerRows: 1,
            widths: ['*', 50, 80],
            body: _getBreakdownByTaskItems()
          },
        },
        '\n\n',
        '\n\n',
        _getSubTitle('Breakdown by Team Members'),
        {
          layout: _defaultTableLayout,
          table: {
            headerRows: 1,
            widths: ['*', 50, 80],
            body: _getBreakdownByTeamMembers()
          },
        },
        '\n\n',
        '\n\n',
        _getSubTitle('Work Items'),
        {
          layout: _defaultTableLayout,
          table: {
            headerRows: 1,
            widths: [60, 60, '*', 40, 60],
            body: _getWorkItems()
          },
        },
        '\n\n',
        '\n\n',
        _getSubTitle('Totals'),
        {
          layout: _footerTableLayout,
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              _getTotalLine('Total Hours', _totalHours),
              _getTotalLine('Total Billable Amount', _currency + ' ' + _totalBillableAmount),
            ],
          },
        },
        ..._notes
      ],
      styles: {
        notesTitle: {
          fontSize: 10,
          bold: true,
          margin: [0, 50, 0, 3],
        },
        notesText: {
          fontSize: 10,
        },
      },
      defaultStyle: {
        columnGap: 20,
      }
    }; 
    return DocumentDefinition;
  }
  const setLogo = async (params) => {
    const { logoFilePath } = params;
    if(logoFilePath != undefined && logoFilePath != null) {
      if(logoFilePath.indexOf('http://') == 0 || logoFilePath.indexOf('https://') == 0) {
        await fetch(logoFilePath)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
            }
            return response.arrayBuffer();
          })
          .then((arrayBuffer) => {
            const byteArray = new Uint8Array(arrayBuffer);
            let binaryString = '';
            for (let i = 0; i < byteArray.byteLength; i++) {
              binaryString += String.fromCharCode(byteArray[i]);
            }
            _logoFile = btoa(binaryString);
          })
          .catch((error) => {
            console.error(error);
          });
      }
      else {
        _logoFile = fs.readFileSync(logoFilePath, 'base64'); 
      }
    }
  }
  const setWorkItems = (items) => { 
    _workItems = items || [];
    return true;
  }
  const setBreakdownByTaskItems = (items) => { 
    _breakdownByTaskItems = items || [];
    return true;
  }
  const setBreakdownByTeamMembers = (items) => { 
    _breakdownByTeamMembers = items || [];
    return true;
  }
  const setHeader = (items) => { 
    _header = items || [];
    return true;
  }
  const setTotals = (params) => {
    const { totalHours, totalBillableAmount } = params;
    _totalHours = totalHours;
    _totalBillableAmount = totalBillableAmount;
    return true;
  }
  const setNotes = (params) => {
    const { title, text } = params;
    if(title != undefined) _notes.push({ text: title.toUpperCase(), style: 'notesTitle'});
    if(text != undefined) _notes.push({ text, style: 'notesText'});
    return true;
  }
  return {
    get,
    setLogo,
    setWorkItems,
    setTotals,
    setBreakdownByTeamMembers,
    setBreakdownByTaskItems,
    setHeader,
    setNotes
  };
}

export { Document } 