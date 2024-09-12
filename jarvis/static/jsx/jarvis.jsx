var Router = ReactRouter;
var { Route, RouteHandler } = Router;

$c = (component) => $(React.findDOMNode(component));

var schedulerPlan = [];
var inMiddleCollege = false;

class App extends React.Component {
  render() {
    return (
      <div>
        <nav className="navbar navbar-inverse navbar-static-top">
          <div className="container">
            <div className="row">
              <div className="col-sm-12">
                <div className="navbar-header">
                  <a className="navbar-brand" href="#">Jarvis</a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <RouteHandler/>
        <div className="footer">
          <div className="container">
            <div className="row">
              <div className="col-sm-6">
                Made with <i className="glyphicon glyphicon-heart"></i> by Lee Mracek, Max Ovsiankin and Ali Asif
              </div>
              <div className="col-sm-6">
                <div className="text-right">
                  Source on <a href="https://github.com/gratimax/jarvis">GitHub</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Home extends React.Component {


  render() {
    var tagline = "Jarvis crunches the best De Anza schedule so that you don't have to.";
    return (
      <div className="jumbotron">
        <div className="container">
          <h1>Jarvis</h1>
          <p>{tagline}</p>
          <p>
            <a className="btn btn-primary btn-lg" href="#/search-courses">
              Get started »
            </a>
          </p>
        </div>
      </div>
    );
  }
}

class SearchCourses extends React.Component {

  constructor() {
    this.state = {searchQuery: '', plan: [], inMiddleCollege: false};
  }

  handleSearch(evt) {
    evt.preventDefault();
    this.setState({searchQuery: $c(this.refs.search).val(), plan: this.state.plan, classTypes: $c(this.refs.classTypeSelect).val()});
  }

  removeFromPlan(courseTitle) {
    var newPlan = this.state.plan.filter(courseResult => courseResult.course.title !== courseTitle);
    this.setState({
      searchQuery: this.state.searchQuery,
      plan: newPlan
    });
    schedulerPlan = newPlan.map(courseResult => courseResult.options);
  }

  addToPlan(courseResult) {
    var newPlan = this.state.plan.concat([courseResult]);
    this.setState({
      searchQuery: this.state.searchQuery,
      plan: newPlan
    });
    schedulerPlan = newPlan.map(courseResult => courseResult.options);
  }

  setMiddleCollege() {
    inMiddleCollege = $c(this.refs.inMiddleCollege)[0].checked;
  }

  componentDidMount() {
    $('#class-type-select').multiselect({
        buttonWidth: '100%'
    });
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <h1>Search Courses</h1>
            <p>Get started by searching courses.</p>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-3">
            <form role="form" onSubmit={this.handleSearch.bind(this)} ref="search-form">
              <div className="row input-group bottom20">
                <input className="form-control" type="text" placeholder="Search..." ref="search"/>
                <span className="input-group-btn">
                    <button type="submit" className="btn btn-primary"><i className="glyphicon glyphicon-search"></i></button>
                </span>
              </div>
              <div className="row">
                <select id="class-type-select" multiple="multiple" ref="classTypeSelect">
                    <option selected="selected" value="hybrid">Hybrid (*)</option>
                    <option selected="selected" value="communities">Learning in Communities (+)</option>
                    <option selected="selected" value="community-service">Community Service Learning (^)</option>
                    <option selected="selected" value="offcampus">Off-Campus (#)</option>
                </select>
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" ref="inMiddleCollege" onClick={this.setMiddleCollege.bind(this)}/>
                  Include Middle College in Schedule
                </label>
              </div>
            </form>
            <CoursePlan plan={this.state.plan} removeFromPlan={this.removeFromPlan.bind(this)}/>
          </div>
          <div className="col-sm-9">
            <SearchResults searchQuery={this.state.searchQuery} classTypes={this.state.classTypes} addToPlan={this.addToPlan.bind(this)}
                inMiddleCollege={this.state.inMiddleCollege}/>
          </div>
        </div>
      </div>
    );
  }
}

class CoursePlan extends React.Component {

  render() {
    var content;
    if (this.props.plan.length > 0) {
      content = (
          <div>
            <ul className="list-group">
              {this.props.plan.map(courseResult =>
                <li className="list-group-item">
                  {courseResult.course.title} ({courseResult.options.length} options)
                  <button className="btn btn-xs pull-right"
                          onClick={() => this.props.removeFromPlan(courseResult.course.title)}>
                    <i className="glyphicon glyphicon-remove"></i>
                  </button>
                </li>
              )}
            </ul>
            <a href="#/scheduler" className="btn btn-primary">Create Schedules!</a>
          </div>
      );
    } else {
      content = <p>Search for classes, then click the "add to plan" button to add them here!</p>;
    }
    return (
      <div>
        <h3>Plan</h3>
        {content}
      </div>

    )
  }

}

class SearchResults extends React.Component {

  constructor(props) {
    super(props);
    this.state = {loading: true};
  }

  componentWillReceiveProps(newProps) {
    this.setState({loading: true});
    $.ajax({
      type: 'POST',
      url: '/search',
      data: JSON.stringify({query: newProps.searchQuery, class_types: newProps.classTypes}),
      contentType: 'application/json',
      dataType: 'json',
      success: function (data) {
        var pairs = [];
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            var options = data[key];
            pairs.push({course: {title: key, description: options[0].title}, options: options});
          }
        }
        this.setState({loading: false, results: pairs});
      }.bind(this)
    });
  }

  shouldComponentUpdate(newProps, newState) {
    return newProps.searchQuery !== this.props.searchQuery || this.state.results !== newState.results
        || newProps.classTypes !== this.props.classTypes;
  }

  flatten(lists) {
    return [].concat.apply([], lists);
  }

  render() {
    var output;
    if (this.props.searchQuery == '') {
      output = (
        <ul className="list-group">
          <li className="list-group-item">
            <span className="text-muted">results will appear here...</span>
          </li>
        </ul>
      );
    } else {
      if (this.state.loading) {
        output = <Spinner/>;
      } else {
        //var numResults = this.state.results
        //  .map((result) => result.options.length)
        //  .reduce((a, b) => a + b);
        var numResults = this.state.results.length;
        output = <ul className="list-item-group">
          <li className="list-group-item text-right">{numResults} {numResults == 1 ? "result" : "results"}</li>
          {this.state.results.map(result =>
            <CourseSearchResult result={result} addToPlan={this.props.addToPlan}/>
          )}
        </ul>;
      }
    }
    return output;
  }

}

class CourseSearchResult extends React.Component {

  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  toggleOpen() {
    this.setState({open: !this.state.open});
  }

  render() {
    var options;
    if (this.state.open) {
      options = (
          <ul className="list-item-group" onClick={this.toggleOpen.bind(this)}>
            {this.props.result.options.map(option =>
                <CourseSearchResultOption option={option}/>
            )}
          </ul>
      );
    } else {
      options = null;
    }
    return (
      <li className="list-group-item search-result">
        <h4 className="list-group-item-heading">{this.props.result.course.title}</h4>
        <div className="btn-group pull-right">
          <button type="button" className="btn btn-default" onClick={() => this.props.addToPlan(this.props.result)}>Add to plan</button>
          <button type="button" className="btn btn-default" onClick={() => this.toggleOpen()}>
            {this.state.open ? "Hide Options" : "Show Options"}
            <i className={"glyphicon glyphicon-chevron-" + (this.state.open ? "up" : "down")}></i>
          </button>
        </div>
        <p>{this.props.result.course.description}</p>
        {options}
      </li>
    );
  }

}

class CourseSearchResultOption extends React.Component {

  formatTime(time) {
    return moment({H: time.hours, m: time.minutes}).format('h:mm a');
  }

  meetingTime(time) {
    if (time === "TBA") {
      return time;
    } else {
      return `${this.formatTime(time.start)} - ${this.formatTime(time.end)}`;
    }
  }

  meetingRating(instructor) {
    if (instructor.rating === "unknown") {
      return instructor.rating;
    } else {
      return instructor.rating.score;
    }
  }

  meetingInstructor(meeting) {
    var rating_url = '';
    if (meeting.instructor.rating !== "unknown") {
      rating_url = "http://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + meeting.instructor.rating.rating_id;
    }
    var instructor_name = `${meeting.instructor.first_name} ${meeting.instructor.last_name}`;
    if (rating_url === "") {
      return instructor_name;
    } {
      return <a href={rating_url}>{instructor_name}</a>;
    }
  }

  uniq(arr) {
    return arr.filter((x, i) => arr.indexOf(x) === i);
  }

  totalRating() {
    var ratings = this.props.option.meetings.map(meeting => this.meetingRating(meeting.instructor)).filter(rating => rating !== "unknown");
    if (ratings.length === 0) {
      return "unknown";
    } else {
      return (20 * ratings.reduce((a, b) => a + b) / ratings.length).toFixed();
    }
  }

  ratingHue(rating) {
    var a = 0.012;
    return a * rating * rating;
  }

  ratingStyle() {
    var total = this.totalRating();
    if (total !== "unknown") {
      return {
        color: `hsla(${this.ratingHue(total)}, 80%, 40%, 1)`
      };
    } else {
      return {};
    }
  }

  render() {
    return (
      <li className="list-group-item">
        <p className="list-group-item-text">

          <div className="row">
            <div className="col-xs-3">
              #{this.props.option.crn}
            </div>
            <div className="col-xs-3" style={this.ratingStyle()}>
              <strong>{this.totalRating()}</strong>
            </div>
            <div className="col-xs-3">
              {this.uniq(this.props.option.meetings.map(this.meetingInstructor))}
            </div>
            <div className="col-xs-3">
              <span className="text-muted">({this.props.option.course})</span>
            </div>
          </div>
        </p>
      </li>
    )
  }

}

class Spinner extends React.Component {

  render() {
    return (
      <div className="spinner">
        <div className="rect1"></div>
        <div className="rect2"></div>
        <div className="rect3"></div>
        <div className="rect4"></div>
        <div className="rect5"></div>
      </div>
    )
  }

}

class Scheduler extends React.Component {

  constructor() {
    var middleCollegeCourse = {
      course: "MIDDLE-COLLEGE",
      title: "Middle College",
      crn: "3RR31P",
      meetings: [
        {
          days: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday"
          ],
          instructor: {
            first_name: "M",
            last_name: "Staff",
            rating: "unknown"
          },
          location: "G Building",
          time: {
            start: {
              hours: 12,
              minutes: 30
            },
            end: {
              hours: 15,
              minutes: 20
            }
          },
          type: "Class"
        }
      ]
    };
    var fullSchedulerPlan = inMiddleCollege ? [[middleCollegeCourse]].concat(schedulerPlan) : schedulerPlan;
    if (fullSchedulerPlan.length > 0) {
      this.state = {loading: true, results: []};
      $.ajax({
        type: 'POST',
        url: '/schedule',
        data: JSON.stringify(fullSchedulerPlan),
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
          this.setState({loading: false, results: data});
        }.bind(this)
      });
    } else {
      this.state = {loading: false, results: []};
    }
  }

  //componentWillReceiveProps(newProps) {
  //  this.setState({loading: true});
  //
  //}

  render() {
    var output;
    if (this.state.loading) {
      output = <Spinner/>;
    } else {
      if (this.state.results.length > 0) {
        var numResults = this.state.results.length;
        output = <ul className="list-item-group">
          <li className="list-group-item text-right">{numResults} {numResults == 1 ? "result" : "results"}</li>
          {this.state.results.map(result =>
            <ScheduleResult result={result} />
          )}
        </ul>;
      } else {
        output = <ul className="list-item-group">
          <li className="list-group-item text-right">0 results</li>
          <li className="list-group-item text-right">No schedules found :( :( :( try another plan?</li>
        </ul>;
      }
    }
    return (
        <div className="container">
          <div className="row">
            <div className="col-sm-12">
              <h1>Scheduler Output</h1>
              {output}
            </div>
          </div>
        </div>
    );
  }
}

class ScheduleResult extends React.Component {

  ratingHue(rating) {
    var a = 0.012;
    return a * rating * rating;
  }

  ratingStyle() {
    var total = this.props.result.rating;
    if (total !== "unknown") {
      return {
        color: `hsla(${this.ratingHue(total)}, 80%, 40%, 1)`
      };
    } else {
      return {};
    }
  }

  render() {
    var result = this.props.result;
    return (
        <li className="list-group-item">
          <div className="row">
            <div className="col-sm-1">
              <h3 style={this.ratingStyle()}>
                {result.rating === "unknown" ? "??" : result.rating.toFixed()}
              </h3>
            </div>
            <div className="col-sm-11">
              <ul className="list-item-group">
                {result.schedule.map(course =>
                  <CourseSearchResultOption option={course}/>
                )}
                <li className="list-group-item viz">
                  <ScheduleVisualization result={result} />
                </li>
              </ul>
            </div>
          </div>
        </li>
    );
  }

}

class ScheduleVisualization extends React.Component {

  days() {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  }

  hours() {
    var hours = [];
    for (var i = 1; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  }

  getTime(time) {
    return 60 * time.hours + time.minutes;
  }

  getTimeRange(range) {
    return {start: this.getTime(range.start), end: this.getTime(range.end)};
  }

  displayHr(hour) {
    if (hour < 12) {
      return hour + ' am';
    } else if (hour == 12) {
      return '12 pm';
    } else {
      return (hour - 12) + ' pm';
    }
  }

  meetingDays() {
    var schedule = this.props.result.schedule;
    var byDay = {};
    this.days().forEach(day => byDay[day] = []);

    schedule.forEach(course => {
      course.meetings.forEach(meeting => {
        if (meeting.time !== "TBA") {
          var meetingInfo = {course: course.course, time: this.getTimeRange(meeting.time)};
          meeting.days.forEach(day => {
            byDay[day].push(meetingInfo);
          });
        }
      });
    });

    return this.days().map(day =>
      ({
        day: day,
        events: byDay[day].sort((m1, m2) => m1.time.start - m2.time.start)
      })
    );
  }

  flatten(lists) {
    return [].concat.apply([], lists);
  }

  render() {
    var meetings = this.meetingDays();
    var minTime = Math.min.apply(null, this.flatten(meetings.map(meeting => meeting.events.map(event => event.time.start))));
    var maxTime = Math.max.apply(null, this.flatten(meetings.map(meeting => meeting.events.map(event => event.time.end))));
    var minHourSize = (minTime / 60 - 1) * 60 / 2 - 20; // WHO SAID THEY DIDN'T LIKE MAGIC NUMBERS????
    return (
        <div className="row">
          {this.hours().filter(hour => hour >= (minTime / 60 - 1) && hour <= (maxTime / 60)).map(hour =>
            <div className="hour-line text-muted" style={{top: hour * 60 / 2 + 10 - minHourSize}}>{this.displayHr(hour)}</div>
          )}
          {meetings.map(meeting =>
            <div className="col-xs-2 viz-day text-center text-bold" style={{height: maxTime / 2 + 10 - minHourSize}}>
              {meeting.day}
              {meeting.events.map(event =>
                <div className="viz-event" style={{top: event.time.start / 2 - minHourSize, height: (event.time.end - event.time.start) / 2}}>
                  {event.course}
                </div>
              )}
            </div>
          )}
        </div>
    )
  }

}

var routes = (
  <Route handler={App}>
    <Route path="/" handler={Home}/>
    <Route path="search-courses" handler={SearchCourses}/>
    <Route path="scheduler" handler={Scheduler}/>
  </Route>
);

Router.run(routes, Router.HashLocation, Root => {
  React.render(<Root/>, $("#app").get(0));
});
