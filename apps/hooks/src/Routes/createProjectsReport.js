import * as fs from 'fs';
import dotenv from 'dotenv';
import pdfMake from 'pdfmake';
import { DateTime, Duration } from 'luxon';
import { Backend as GraphQLClient } from '@happy-path/graphql-client';
import { Client as EmailClient } from '@happy-path/mailjet-client';
import { Timers, Projects } from '@happy-path/graphql-entities';
import { Document as DefaultDocument } from './Documents/Default.js';
import { metadata as parseMetadata } from '@happy-path/calculator';

dotenv.config();

const create =  async (req, res, next) => {
  const { collection, keys: projectIds } = req.body.data.body;
  const [ { metadata: metadataTemplate } ] = req.body.metadata;
  if(projectIds.length > (process.env.REPORTS_MAX_NUMBER_OF_PROJECTS_TO_PROCESS || 12)) throw new Error(`Max number of projects exceeded.`);
  if(metadataTemplate == undefined) res.status(403).send({error: `Metadata is missing. Exiting.`});
  if(collection != 'projects') res.status(403).send({error: `Can process only for type "projects". Exiting.`});
  const fonts = {
    Roboto: {
      normal: './fonts/Roboto/Roboto-Regular.ttf',
      italics: './fonts/Roboto/Roboto-Italic.ttf',
      bold: './fonts/Roboto/Roboto-Medium.ttf',
      bolditalics: './fonts/Roboto/Roboto-MediumItalic.ttf'
    }
  };
  let numberOfDocsProcessed = 0;
  let emailClient = EmailClient()
    .setSubject('Monthly Reports')
    .setBody({ html: '<p>Please find your monthly reports attached.</p>' });
  const startsAt = req.params.month == 'last' ? DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).minus({ months: 1 }).startOf('month').toUTC().toISO() : DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).startOf('month').toUTC().toISO();
  const endsAt = req.params.month == 'last' ? DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).minus({ months: 1 }).endOf('month').toUTC().toISO() : DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).endOf('month').toUTC().toISO();
  await Promise.all(
    projectIds.map(async (projectId) => {
      const { project_name: projectName, metadata: projectMetadata } = await Projects({ client: GraphQLClient() }).findProjectById({ projectId });
      const { price_modifiers: priceModifiers, reports } = parseMetadata([metadataTemplate, projectMetadata]);
      if(reports == undefined) throw new Error('Reports section required in project metadata.');
      let timers = await Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' }).findTimersByProjectId({ 
        projectId,
        startsAt,
        endsAt,
      });
      if(reports?.excluded_tasks !== undefined && Array.isArray(reports?.excluded_tasks) && reports?.excluded_tasks.length > 0) {
        timers = timers.filter(timer => !reports.excluded_tasks.includes(timer.task.tasks_id.task_name));
      }
      if(timers.length) {
        const totalHours = Duration.fromObject({ 
          minutes: timers.reduce((acc, item) => acc + item.total_duration, 0)
        }).toFormat('hh:mm');
        const totalBillableAmount = timers.reduce((acc, item) => acc + item.total_cost, 0).toCurrency(reports?.currency);
        const tasks = timers.reduce((tasks, timer) => {
          const task = tasks.find(task => task.taskTitle == timer.task.tasks_id.task_name);
          if (task == undefined) {
            tasks.push({ 
              taskTitle: timer.task.tasks_id.task_name,
              totalMinutes: timer.total_duration,
              totalBillableAmount: timer.total_cost
            });
          }
          else {
            task.totalMinutes += timer.total_duration;
            task.totalBillableAmount += timer.total_cost;
          }
          return tasks;
        }, []);
        const people = timers.reduce((people, timer) => {
          const person = people.find(person => person.email == timer.user_id?.email);
          if (person == undefined) {
            people.push({ 
              email: timer.user_id?.email,
              nameSurname: [timer.user_id?.first_name, timer.user_id?.last_name].join(' '),
              totalMinutes: timer.total_duration,
              totalBillableAmount: timer.total_cost
            });
          }
          else {
            person.totalMinutes += timer.total_duration;
            person.totalBillableAmount += timer.total_cost;
          }
          return people;
        }, []);
        const dd = DefaultDocument();
        if(priceModifiers && priceModifiers.length > 0) dd.setNotes({
            title: 'Applied Price Modifiers',
            text: priceModifiers.map(priceModifier => ( '- ' + priceModifiersDescriptions[priceModifier]) ).join('\n')
          });
        dd.setCurrency(reports?.currency);
        dd.setHeader([
          { label: 'Project', value: projectName },
          { label: 'Created At', value: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).toLocaleString(DateTime.DATE_MED) },
          { label: 'Valid For', value: (req.params.month == 'last' ? DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).minus({ months: 1 }).toFormat('MMMM yyyy') : DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).toFormat('MMMM yyyy')) },
        ]);
        dd.setTotals({ totalHours, totalBillableAmount });
        const includedReports = reports.included_reports || [];
        if(includedReports.includes('breakdown_by_tasks')) {
          dd.setBreakdownByTaskItems(tasks.map(task => ({ totalHours: Duration.fromObject({ minutes: task.totalMinutes}).toFormat('hh:mm'), ...task })));
        }
        if(includedReports.includes('breakdown_by_team_members')) {
          dd.setBreakdownByTeamMembers(people.map(person => ({ totalHours: Duration.fromObject({ minutes: person.totalMinutes}).toFormat('hh:mm'), ...person })));
        }
        if(includedReports.includes('work_items')) {
          dd.setWorkItems(
            timers.map(timer => ({
              date: DateTime.fromISO(timer.starts_at, { zone: 'UTC' }).setZone(process.env.TIMEZONE || 'UTC').toLocaleString(DateTime.DATE_MED), 
              nameSurname: `${timer.user_id?.first_name} ${timer.user_id?.last_name[0] || ''}`, 
              task: timer.task.tasks_id.task_name, 
              hours: Duration.fromObject({ minutes: timer.total_duration}).toFormat('hh:mm'), 
              billableAmount: timer.total_cost,
              notes: timer.notes,
            }))
          );
        }
        await dd.setLogo({ logoFilePath: process.env.REPORTS_LOGO_URI });
        const printer = new pdfMake(fonts);
        const pdfDoc = printer.createPdfKitDocument(dd.get());
        await new Promise((resolve, reject) => {
          let chunks = [];
          pdfDoc.on('data', chunk => chunks.push(chunk));
          pdfDoc.on('end', () => {
            emailClient.addAttachment({ filename: `report-${projectId}.pdf`, contentType: 'application/pdf', base64File: Buffer.concat(chunks).toString('base64') });
            resolve();
          });
          pdfDoc.end();
        });
        numberOfDocsProcessed++;
        if(reports?.recipients !== undefined && reports.recipients.length > 0) {
          reports.recipients.forEach(email => emailClient.addRecipent({ email }));
          emailClient.send();
        }
      }
    })
  );
  res.json({ok: true, numberOfDocsProcessed});
}

const priceModifiersDescriptions = {
  noLessThanOneHour: `We rounded the fees to one hour for works which took less than 60 minutes.`,
  weekends: `We charged x1,5 of the regular fee for the works we've done during the weekends.`,
  overtime: `We charged x1,5 of the regular fee for the works we've done out of the office hours.`,
};

export { create }
