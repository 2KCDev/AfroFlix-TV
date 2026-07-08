import React from 'react';
import ActorCard from '../cards/ActorCard';

const ActorGrid = ({ actors = [] }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {actors.map((actor, index) => (
      <ActorCard key={actor.id || actor.slug} actor={actor} eager={index === 0} />
    ))}
  </div>
);

export default ActorGrid;
