import * as fs from 'fs';
import YAML from 'yaml';
import dotenv from 'dotenv';
import pdfMake from 'pdfmake';
import { DateTime, Duration } from 'luxon';
import { GraphQLClient as graphqlClient } from '@happy-path/graphql-client';
import { Client as EmailClient } from '@happy-path/mailjet-client';
import { Timers, Projects } from '@happy-path/graphql-entities';
import { Document as DefaultDocument } from './Documents/Default.js';

dotenv.config();

const create =  async (req, res, next) => {
  const { collection, keys: projectIds } = req.body.data.body;
  const [ { metadata: metadataTemplate } ] = req.body.metadata;

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
  const emailRecipents = process.env.REPORTS_EMAIL_RECIPENTS.split(',') || [];
  let numberOfDocsProcessed = 0;
  let emailClient = EmailClient();
  await Promise.all(
    projectIds.map(async (projectId) => {
      const timers = await Timers({ graphqlClient }).findTimersByProjectId({ 
        projectId,
        startsAt: DateTime.now().startOf('month').toISO(),
        endsAt: DateTime.now().endOf('month').toISO(),
      });
      if(timers.length) {
        const dd = DefaultDocument();
        const { project_name: projectName, metadata: projectMetadata } = await Projects({ graphqlClient }).findProjectById({ projectId });
        const { price_modifiers: priceModifiers } = YAML.parse(metadataTemplate.trim() + '\n' + projectMetadata.trim());
        const totalHours = Duration.fromObject({ 
          minutes: timers.reduce((acc, item) => acc + item.total_duration, 0)
        }).toFormat('hh:mm');
        const totalBillableAmount = timers.reduce((acc, item) => acc + item.total_cost, 0).toFixed(2);
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
          const person = people.find(person => person.email == timer.user_id.email);
          if (person == undefined) {
            people.push({ 
              email: timer.user_id.email,
              nameSurname: [timer.user_id.first_name, timer.user_id.last_name].join(' '),
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
        if(priceModifiers.length > 0) dd.setNotes({
            title: 'Applied Price Modifiers',
            text: priceModifiers.map(priceModifier => ( '- ' + priceModifiersDescriptions[priceModifier]) ).join('\n')
          });
        dd.setHeader([
          { label: 'Project', value: projectName },
          { label: 'Created At', value: DateTime.now().toLocaleString(DateTime.DATE_MED) },
          { label: 'Valid For', value: DateTime.now().toFormat('MMMM yyyy') },
        ]);
        dd.setTotals({ totalHours, totalBillableAmount });
        dd.setBreakdownByTaskItems(tasks.map(task => ({ totalHours: Duration.fromObject({ minutes: task.totalMinutes}).toFormat('hh:mm'), ...task })));
        dd.setBreakdownByTeamMembers(people.map(person => ({ totalHours: Duration.fromObject({ minutes: person.totalMinutes}).toFormat('hh:mm'), ...person })));
        dd.setWorkItems(
          timers.map(timer => ({
            date: DateTime.fromISO(timer.starts_at).toLocaleString(DateTime.DATE_MED), 
            nameSurname: `${timer.user_id.first_name} ${timer.user_id.last_name[0] || ''}`, 
            task: timer.task.tasks_id.task_name, 
            hours: Duration.fromObject({ minutes: timer.total_duration}).toFormat('hh:mm'), 
            billableAmount: timer.total_cost
          }))
        );
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
      }
    })
  );
  if(emailRecipents.length > 0) {
    emailRecipents.forEach(email => emailClient.addRecipent({ email }));
    emailClient.setSubject('Monthly Reports');
    emailClient.setBody({ html: '<p>Please find your monthly reports attached.</p>' });
    emailClient.send();
  }
  res.json({ok: true, numberOfDocsProcessed});
}

const priceModifiersDescriptions = {
  noLessThanOneHour: `We rounded the fees to one hour for works which took less than 60 minutes.`,
  weekends: `We charged x1,5 of the regular fee for the works we've done during the weekends.`,
  overtime: `We charged x1,5 of the regular fee for the works we've done out of the office hours.`,
};

export { create }
